import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Post from "../models/postModel";
import PostEmbedding from "../models/postEmbeddingModel";
import User from "../models/userModel";
import chunkingService from "../services/chunkingService";
import { cosineSimilarity } from "../services/ragService";
import { normalizeVector } from "../services/embeddingService";
import ragService from "../services/ragService";
import { generateTokens } from "../utils/authUtils";

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test_rag";
const mockFetch = jest.fn();

let app: any;
let accessToken: string;
let testUserId: string;

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch = mockFetch as unknown as typeof fetch;
  process.env.MONGO_URI = TEST_MONGO_URI;
  process.env.JWT_SECRET = "secret_key";
  process.env.JWT_REFRESH_SECRET = "refresh_secret_key";
  process.env.GEMINI_EMBEDDING_DIMENSIONS = "32";
  process.env.RAG_MIN_SCORE = "0.35";
  process.env.RAG_TOP_K = "3";
  app = await initApp();
});

afterAll(async () => {
  await PostEmbedding.deleteMany();
  await Post.deleteMany();
  await User.deleteMany();
  await mongoose.disconnect();
});

describe("RAG utilities", () => {
  test("chunks text with overlap", () => {
    process.env.RAG_CHUNK_SIZE = "20";
    process.env.RAG_CHUNK_OVERLAP = "5";

    const chunks = chunkingService.chunkText("alpha beta gamma delta epsilon zeta eta theta");

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text.length).toBeLessThanOrEqual(20);
    expect(chunks[1].chunkIndex).toBe(1);

    delete process.env.RAG_CHUNK_SIZE;
    delete process.env.RAG_CHUNK_OVERLAP;
  });

  test("cosine similarity ranks closer vectors higher", () => {
    const query = normalizeVector([1, 0, 0]);
    const close = normalizeVector([0.9, 0.1, 0]);
    const far = normalizeVector([0, 1, 0]);

    expect(cosineSimilarity(query, close)).toBeGreaterThan(cosineSimilarity(query, far));
  });
});

describe("RAG API", () => {
  beforeEach(async () => {
    await PostEmbedding.deleteMany();
    await Post.deleteMany();
    await User.deleteMany();
    mockFetch.mockReset();

    const user = await User.create({
      username: "RagUser",
      email: "rag@test.com",
      password: "password123",
    });

    testUserId = user._id.toString();
    accessToken = generateTokens(testUserId, user.username).accessToken;
  });

  test("post create, update and delete maintain embedding records", async () => {
    const createResponse = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Ferrari tire strategy shaped the race result" });

    expect(createResponse.status).toBe(201);

    const postId = createResponse.body.id;
    expect(await PostEmbedding.countDocuments({ postId })).toBeGreaterThan(0);

    const updateResponse = await request(app)
      .put(`/api/post/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Mercedes pit strategy changed the final stint" });

    expect(updateResponse.status).toBe(200);

    const updatedEmbedding = await PostEmbedding.findOne({ postId }).lean();
    expect(updatedEmbedding?.text).toContain("Mercedes");

    const deleteResponse = await request(app)
      .delete(`/api/post/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(await PostEmbedding.countDocuments({ postId })).toBe(0);
  });

  test("ask returns grounded answer with source chunks", async () => {
    const post = await Post.create({
      text: "Ferrari tire strategy was the key topic after the race.",
      author: testUserId,
    });
    await ragService.rebuildPostEmbeddings(String(post._id));

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: `Ferrari tire strategy was discussed in the retrieved post [${post._id}].`,
      }),
    });

    const response = await request(app)
      .post("/api/rag/ask")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ question: "What discussed Ferrari tire strategy?" });

    expect(response.status).toBe(200);
    expect(response.body.answer).toContain("Ferrari");
    expect(response.body.sources).toHaveLength(1);
    expect(response.body.sources[0].postId).toBe(String(post._id));
    expect(response.body.meta.embeddingModel).toBe("gemini-embedding-001");
  });

  test("ask returns no-source answer when scores are too low", async () => {
    process.env.RAG_MIN_SCORE = "0.99";
    await Post.create({
      text: "Coffee tasting notes and espresso grinders",
      author: testUserId,
    });

    const response = await request(app)
      .post("/api/rag/ask")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ question: "Formula racing tire strategy" });

    expect(response.status).toBe(200);
    expect(response.body.sources).toEqual([]);
    expect(response.body.answer).toContain("do not have enough source information");
    expect(mockFetch).not.toHaveBeenCalled();
    process.env.RAG_MIN_SCORE = "0.35";
  });

  test("existing search endpoint uses embeddings without frontend contract changes", async () => {
    const createResponse = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "Ferrari tire strategy shaped the race result" });

    expect(createResponse.status).toBe(201);

    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "Ferrari strategy" });

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].id).toBe(createResponse.body.id);
    expect(response.body.pagination.totalPosts).toBe(1);
    expect(response.body.ai.usingEmbeddings).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("existing recommendations endpoint uses embeddings before LLM fallback", async () => {
    process.env.RAG_RECOMMENDATION_MIN_SCORE = "0.1";

    const otherUser = await User.create({
      username: "RagOther",
      email: "rag-other@test.com",
      password: "password123",
    });

    await Post.create({
      text: "Football tactics and league analysis",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });

    const candidate = await Post.create({
      text: "football drills for beginners",
      author: otherUser._id,
    });
    await ragService.rebuildPostEmbeddings(String(candidate._id));

    const response = await request(app)
      .get("/api/post/recommendations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(String(candidate._id));
    expect(response.body.usingEmbeddings).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();

    delete process.env.RAG_RECOMMENDATION_MIN_SCORE;
  });

  test("recommendations filter ineligible posts before embedding ranking", async () => {
    process.env.RAG_RECOMMENDATION_MIN_SCORE = "0.1";

    const otherUser = await User.create({
      username: "RagFilterOther",
      email: "rag-filter-other@test.com",
      password: "password123",
    });

    const likedPost = await Post.create({
      text: "Basketball defense rotations and transition offense",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });
    const ownPost = await Post.create({
      text: "Basketball defense rotations from my own profile",
      author: testUserId,
    });
    const alreadyLikedCandidate = await Post.create({
      text: "Basketball defense rotations already liked",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });
    const eligibleCandidate = await Post.create({
      text: "Basketball defense rotations for youth teams",
      author: otherUser._id,
    });

    await Promise.all([
      ragService.rebuildPostEmbeddings(String(likedPost._id)),
      ragService.rebuildPostEmbeddings(String(ownPost._id)),
      ragService.rebuildPostEmbeddings(String(alreadyLikedCandidate._id)),
      ragService.rebuildPostEmbeddings(String(eligibleCandidate._id)),
    ]);

    const response = await request(app)
      .get("/api/post/recommendations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(String(eligibleCandidate._id));
    expect(response.body.usingEmbeddings).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();

    delete process.env.RAG_RECOMMENDATION_MIN_SCORE;
  });
});
