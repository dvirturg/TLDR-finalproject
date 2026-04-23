import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Post from "../models/postModel";
import User from "../models/userModel";
import { generateTokens } from "../utils/authUtils";

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test_search";
const mockFetch = jest.fn();

let app: any;
let accessToken: string;
let testUserId: string;
let otherUserId: string;

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch = mockFetch as unknown as typeof fetch;
  process.env.MONGO_URI = TEST_MONGO_URI;
  process.env.JWT_SECRET = "secret_key";
  process.env.JWT_REFRESH_SECRET = "refresh_secret_key";
  app = await initApp();
});

afterAll(async () => {
  await Post.deleteMany();
  await User.deleteMany();
  await mongoose.disconnect();
});

describe("Post search API", () => {
  beforeEach(async () => {
    await Post.deleteMany();
    await User.deleteMany();
    mockFetch.mockReset();

    const [searchUser, otherUser] = await User.create([
      {
        username: "SearchUser",
        email: "search@test.com",
        password: "password123",
      },
      {
        username: "OtherUser",
        email: "other-search@test.com",
        password: "password123",
      },
    ]);

    testUserId = searchUser!._id.toString();
    otherUserId = otherUser!._id.toString();
    accessToken = generateTokens(testUserId, searchUser!.username).accessToken;
  });

  test("returns 401 without auth", async () => {
    const response = await request(app).get("/api/post/search").query({ q: "running" });

    expect(response.status).toBe(401);
  });

  test("returns 400 for empty query", async () => {
    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "   " });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Search query is required");
  });

  test("returns serialized paginated results for a normal query", async () => {
    await Post.create([
      { text: "running recovery workout tips", author: otherUserId, likes: [new mongoose.Types.ObjectId(testUserId)] },
      { text: "morning running drills", author: otherUserId },
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ keywords: ["running"] }) }),
    });

    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "running", page: "1" });

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(2);
    expect(response.body.posts[0]).toHaveProperty("commentCount");
    expect(response.body.posts[0]).toHaveProperty("likedByCurrentUser");
    expect(response.body.pagination.totalPosts).toBe(2);
    expect(response.body.pagination.currentPage).toBe(1);
  });

  test("uses LLM-expanded keywords to match posts beyond the raw query", async () => {
    await Post.create([
      { text: "jogging before breakfast is underrated", author: otherUserId },
      { text: "espresso tasting notes", author: otherUserId },
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ keywords: ["jogging"] }) }),
    });

    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "running" });

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].text).toContain("jogging");
  });

  test("falls back cleanly when LLM parsing fails", async () => {
    await Post.create([
      { text: "football tactics for beginners", author: otherUserId },
      { text: "coffee beans and grinders", author: otherUserId },
    ]);

    mockFetch.mockRejectedValue(new Error("llm unavailable"));

    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "football" });

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].text).toContain("football");
  });

  test("returns empty posts with valid pagination when there are no matches", async () => {
    await Post.create({ text: "coffee beans and grinders", author: otherUserId });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ keywords: ["running"] }) }),
    });

    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "running" });

    expect(response.status).toBe(200);
    expect(response.body.posts).toEqual([]);
    expect(response.body.pagination.totalPosts).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
    expect(response.body.pagination.hasNextPage).toBe(false);
  });

  test("search route is not shadowed by the dynamic id route", async () => {
    const response = await request(app)
      .get("/api/post/search")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ q: "running" });

    expect(response.status).not.toBe(404);
  });
});
