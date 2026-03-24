import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Post from "../models/postModel";
import User from "../models/userModel"; 

const TEST_MONGO_URI = "mongodb://localhost:27017/test_db";
const uploadsDir = path.resolve(__dirname, "../../public/uploads/posts");
const sourceImagesDir = path.resolve(__dirname, "../../../images");

type PostData = { text: string; author: string; imageUrl?: string; _id?: string };

let app: any;
let postsList: PostData[];
let realImagePath: string;
let testUserId: string;

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

const createJsonPost = async (post: PostData) => {
  const response = await request(app).post("/api/post").send(post);
  return response;
};

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.MONGO_URI = TEST_MONGO_URI;
  app = await initApp();
  const imageFiles = await fs.readdir(sourceImagesDir);
  const firstImage = imageFiles.find((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
  if (!firstImage) {
    throw new Error(`No image files found in ${sourceImagesDir}`);
  }
  realImagePath = path.join(sourceImagesDir, firstImage);
  await Post.deleteMany();
  await User.deleteMany();
  await cleanupUploadedFiles();
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

    const user = await User.create({
      username: "PostAuthor",
      email: "author@test.com",
      password: "password123"
    });
    testUserId = user._id.toString();

    postsList = [
      { text: "this is my post", author: testUserId, imageUrl: "" },
      { text: "this is my second post", author: testUserId, imageUrl: "" },
    ];

    for (const post of postsList) {
      const response = await createJsonPost(post);
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
      .field("text", "post with image")
      .field("author", testUserId)
      .attach("image", realImagePath);

    expect(response.status).toBe(201);
    expect(response.body.text).toBe("post with image");
    expect(response.body.author._id).toBe(testUserId);
    expect(response.body.imageUrl).toMatch(/^\/public\/uploads\/posts\//);
  });

  test("Get Post by ID with populate", async () => {
    const response = await request(app).get(`/api/post/${postsList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body.text).toBe(postsList[0].text);
    expect(response.body.author._id).toBe(testUserId);
    expect(response.body.author.username).toBe("PostAuthor");
  });

  test("Update Post and maintain populate", async () => {
    const newText = "Updated Text";
    const response = await request(app)
      .put(`/api/post/${postsList[0]._id}`)
      .send({ text: newText });

    expect(response.status).toBe(200);
    expect(response.body.text).toBe(newText);
    expect(response.body.author.username).toBe("PostAuthor");
  });

  test("Like Post Toggle", async () => {
    const response = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId: testUserId });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post liked successfully");

    const toggleResponse = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId: testUserId });

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.message).toBe("Post unliked successfully");
  });

  test("Delete Post", async () => {
    const response = await request(app).delete(`/api/post/${postsList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post deleted successfully");

    const getResponse = await request(app).get(`/api/post/${postsList[0]._id}`);
    expect(getResponse.status).toBe(404);
  });

  test("Create Post with missing fields", async () => {
    const response = await request(app).post("/api/post").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/text and author are required/i);
  });
});