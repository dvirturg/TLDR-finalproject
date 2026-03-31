import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Post from "../models/postModel";
import User from "../models/userModel"; 
import { generateToken } from "../utils/authUtils"; // ייבוא לייצור טוקן

const TEST_MONGO_URI = "mongodb://localhost:27017/test_db";
const uploadsDir = path.resolve(__dirname, "../../public/uploads/posts");
const sourceImagesDir = path.resolve(__dirname, "../../../images");
const mockFetch = jest.fn();

type PostData = { text: string; author?: string; imageUrl?: string; _id?: string };

let app: any;
let postsList: PostData[];
let realImagePath: string;
let testUserId: string;
let accessToken: string; // משתנה לטוקן

const cleanupUploadedFiles = async () => {
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(
      files
        .filter((file) => file !== ".gitkeep")
        .map((file) => fs.unlink(path.join(uploadsDir, file)).catch(() => undefined)),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
};

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch = mockFetch as unknown as typeof fetch;
  process.env.MONGO_URI = TEST_MONGO_URI;
  process.env.JWT_SECRET = "secret_key"; 
  app = await initApp();
  
  const imageFiles = await fs.readdir(sourceImagesDir);
  const firstImage = imageFiles.find((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
  if (!firstImage) {
    throw new Error(`No image files found in ${sourceImagesDir}`);
  }
  realImagePath = path.join(sourceImagesDir, firstImage);
  
  await Post.deleteMany();
  await User.deleteMany();
});

afterAll(async () => {
  await Post.deleteMany();
  await User.deleteMany();
  await cleanupUploadedFiles();
  await mongoose.disconnect();
});

describe("Post API", () => {
  beforeEach(async () => {
    await Post.deleteMany();
    await User.deleteMany();
    await cleanupUploadedFiles();
    mockFetch.mockReset();

    const user = await User.create({
      username: "PostAuthor",
      email: "author@test.com",
      password: "password123"
    });
    testUserId = user._id.toString();
    accessToken = generateToken(testUserId, user.username);

    postsList = [
      { text: "this is my post" },
      { text: "this is my second post" },
    ];

    for (const post of postsList) {
      const response = await request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(post);
      post._id = response.body._id;
    }
  });

  test("Get All Posts and check populate", async () => {
    const response = await request(app).get("/api/post");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
    expect(response.body[0].author._id).toBe(testUserId);
    expect(response.body[0].author.username).toBe("PostAuthor");
  });

  test("Create Post with image upload", async () => {
    const response = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${accessToken}`) // טוקן
      .field("text", "post with image")
      .attach("image", realImagePath);

    expect(response.status).toBe(201);
    expect(response.body.text).toBe("post with image");
    expect(response.body.author._id).toBe(testUserId);
  });

  test("Update Post and maintain populate", async () => {
    const newText = "Updated Text";
    const response = await request(app)
      .put(`/api/post/${postsList[0]._id}`)
      .set("Authorization", `Bearer ${accessToken}`) // טוקן
      .send({ text: newText });

    expect(response.status).toBe(200);
    expect(response.body.text).toBe(newText);
    expect(response.body.author.username).toBe("PostAuthor");
  });

  test("Like Post Toggle", async () => {
    const response = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post liked successfully");

    const toggleResponse = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.message).toBe("Post unliked successfully");
  });

  test("Delete Post", async () => {
    const response = await request(app)
      .delete(`/api/post/${postsList[0]._id}`)
      .set("Authorization", `Bearer ${accessToken}`); // טוקן
      
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post deleted successfully");
  });

  test("Create Post with missing text returns 400", async () => {
    const response = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({}); 
      
    expect(response.status).toBe(400);
  });

  test("Create Post without token returns 401", async () => {
    const response = await request(app)
      .post("/api/post")
      .send({ text: "No token" });
      
    expect(response.status).toBe(401);
  });

  test("Recommendations route is protected and not treated as :id", async () => {
    const response = await request(app).get("/api/post/recommendations");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Access token missing");
  });

  test("Recommendations return generic fallback feed when user has no liked posts", async () => {
    const otherUser = await User.create({
      username: "OtherUser",
      email: "other@test.com",
      password: "password123",
    });

    await Post.create([
      { text: "other newest post", author: otherUser._id },
      { text: "other older post", author: otherUser._id },
    ]);

    const response = await request(app)
      .get("/api/post/recommendations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((post: any) => post.author.id === otherUser._id.toString())).toBe(true);
    expect(response.body.data.every((post: any) => post.author.id !== testUserId)).toBe(true);
  });

  test("Recommendations use LLM keywords and exclude own and already liked posts", async () => {
    const otherUser = await User.create({
      username: "SportsFan",
      email: "sports@test.com",
      password: "password123",
    });

    const likedSeedPost = await Post.create({
      text: "Football tactics and league analysis",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });

    await Post.create({
      text: "football drills for beginners",
      author: otherUser._id,
    });
    await Post.create({
      text: "football transfers and rumors",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });
    await Post.create({
      text: "football diary from my own profile",
      author: testUserId,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ keywords: ["football"] }) }),
    });

    const response = await request(app)
      .get("/api/post/recommendations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].text).toBe("football drills for beginners");
    expect(response.body.data[0].id).not.toBe(likedSeedPost._id.toString());
    expect(response.body.data[0].author.id).toBe(otherUser._id.toString());
  });

  test("Recommendations fall back to generic feed when LLM returns invalid JSON", async () => {
    const otherUser = await User.create({
      username: "TravelUser",
      email: "travel@test.com",
      password: "password123",
    });

    await Post.create({
      text: "Hiking in the Alps",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });

    await Post.create([
      { text: "city trip tips", author: otherUser._id },
      { text: "beach sunset spots", author: otherUser._id },
    ]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "not valid json" }),
    });

    const response = await request(app)
      .get("/api/post/recommendations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data.every((post: any) => post.author.id === otherUser._id.toString())).toBe(true);
  });

  test("Recommendations fall back to generic feed when LLM returns empty keywords", async () => {
    const otherUser = await User.create({
      username: "FoodUser",
      email: "food@test.com",
      password: "password123",
    });

    await Post.create({
      text: "Coffee and brunch ideas",
      author: otherUser._id,
      likes: [new mongoose.Types.ObjectId(testUserId)],
    });

    await Post.create({ text: "fresh bakery opening", author: otherUser._id });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ keywords: [] }) }),
    });

    const response = await request(app)
      .get("/api/post/recommendations")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((post: any) => post.author.id === otherUser._id.toString())).toBe(true);
  });
});
