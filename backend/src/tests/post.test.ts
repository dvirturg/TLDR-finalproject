import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Post from "../models/postModel";
import { POST_IMAGE_MAX_FILE_SIZE } from "../middleware/postImageUpload";

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test";
const uploadsDir = path.resolve(__dirname, "../../public/uploads/posts");
const sourceImagesDir = path.resolve(__dirname, "../../../images");

type PostData = { text: string; author: string; imageUrl?: string; _id?: string };

let app: any;
let postsList: PostData[];
let realImagePath: string;

const cleanupUploadedFiles = async () => {
  try {
    const files = await fs.readdir(uploadsDir);
    await Promise.all(
      files
        .filter((file) => file !== ".gitkeep")
        .map((file) => fs.unlink(path.join(uploadsDir, file))),
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
  await cleanupUploadedFiles();
});

afterAll(async () => {
  await Post.deleteMany();
  await cleanupUploadedFiles();
  await mongoose.disconnect();
});

describe("Post API", () => {
  beforeEach(async () => {
    await Post.deleteMany();
    await cleanupUploadedFiles();

    const dummyAuthor = new mongoose.Types.ObjectId().toString();
    postsList = [
      { text: "this is my post", author: dummyAuthor, imageUrl: "" },
      { text: "this is my second post", author: dummyAuthor, imageUrl: "" },
      { text: "this is my third post", author: dummyAuthor, imageUrl: "" },
      { text: "this is my fourth post", author: dummyAuthor, imageUrl: "" },
    ];

    for (const post of postsList) {
      const response = await createJsonPost(post);
      post._id = response.body._id || response.body.id;
    }
  });

  test("Create Post", async () => {
    const response = await request(app).get("/api/post");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
    for (let i = 0; i < postsList.length; i++) {
      expect(response.body[i].text).toBe(postsList[i].text);
      expect(response.body[i].author).toBe(postsList[i].author);
      expect(response.body[i].imageUrl).toBe("");
    }
  });

  test("Create Post with image upload", async () => {
    const author = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post("/api/post")
      .field("text", "post with image")
      .field("author", author)
      .attach("image", realImagePath);

    expect(response.status).toBe(201);
    expect(response.body.text).toBe("post with image");
    expect(response.body.author).toBe(author);
    expect(response.body.imageUrl).toMatch(/^\/public\/uploads\/posts\/post-\d+-\d+\.(jpg|jpeg|png|gif|webp)$/);

    const savedPost = await Post.findById(response.body._id);
    expect(savedPost).not.toBeNull();
    expect(savedPost!.imageUrl).toBe(response.body.imageUrl);

    const uploadedFilePath = path.join(uploadsDir, path.basename(response.body.imageUrl));
    const uploadedFileStat = await fs.stat(uploadedFilePath);
    expect(uploadedFileStat.isFile()).toBe(true);
  });

  test("Uploaded image is publicly reachable", async () => {
    const author = new mongoose.Types.ObjectId().toString();

    const createResponse = await request(app)
      .post("/api/post")
      .field("text", "public image")
      .field("author", author)
      .attach("image", realImagePath);

    expect(createResponse.status).toBe(201);

    const imageResponse = await request(app).get(createResponse.body.imageUrl);
    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers["content-type"]).toMatch(/^image\//);
  });
  
  test("Create Post rejects invalid image type", async () => {
    const author = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post("/api/post")
      .field("text", "bad image")
      .field("author", author)
      .attach("image", Buffer.from("not-an-image"), "bad-file.txt");

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/only image files are allowed/i);
  });

  test("Create Post rejects oversized image", async () => {
    const author = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post("/api/post")
      .field("text", "large image")
      .field("author", author)
      .attach("image", Buffer.alloc(POST_IMAGE_MAX_FILE_SIZE + 1, 1), "large-image.png");

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/too large/i);
  });

  test("Get All Posts", async () => {
    const response = await request(app).get("/api/post");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
  });

  test("Get Posts by author", async () => {
    const response = await request(app).get(`/api/post?author=${postsList[0].author}`);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
    expect(response.body[0].text).toBe(postsList[0].text);
  });

  test("Get Post by ID", async () => {
    const response = await request(app).get(`/api/post/${postsList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body.text).toBe(postsList[0].text);
    expect(response.body.author).toBe(postsList[0].author);
    expect(response.body._id).toBe(postsList[0]._id);
  });

  test("Get Post by invalid ID returns 404", async () => {
    const response = await request(app).get("/api/post/000000000000000000000000");
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("Update Post", async () => {
    postsList[0].text = "This is an updated post";
    const response = await request(app)
      .put(`/api/post/${postsList[0]._id}`)
      .send(postsList[0]);
    expect(response.status).toBe(200);
    expect(response.body.text).toBe(postsList[0].text);
    expect(response.body.author).toBe(postsList[0].author);
    expect(response.body._id).toBe(postsList[0]._id);
  });

  test("Update non-existent Post returns 404", async () => {
    const response = await request(app)
      .put("/api/post/000000000000000000000000")
      .send({ text: "should not work" });
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("Delete Post", async () => {
    const response = await request(app).delete(`/api/post/${postsList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Post deleted successfully");

    const getResponse = await request(app).get(`/api/post/${postsList[0]._id}`);
    expect(getResponse.status).toBe(404);
  });

  test("Delete non-existent Post returns 404", async () => {
    const response = await request(app).delete("/api/post/000000000000000000000000");
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("Create Post with missing fields returns 400", async () => {
    const response = await request(app).post("/api/post").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/text and author are required/i);
  });

  test("Like Post", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Post liked successfully");

    const updatedPost = await Post.findById(postsList[0]._id);
    expect(updatedPost).not.toBeNull();
    expect(updatedPost!.likes.map((like) => like.toString())).toContain(userId);
  });

  test("Like Post toggles to unlike on second request", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId });

    const toggleResponse = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId });

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.message).toBe("Post unliked successfully");

    const updatedPost = await Post.findById(postsList[0]._id);
    expect(updatedPost).not.toBeNull();
    expect(updatedPost!.likes.map((like) => like.toString())).not.toContain(userId);
    expect(updatedPost!.likes).toHaveLength(0);
  });

  test("Like Post toggles like then unlike then like again", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const firstResponse = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId });
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.message).toBe("Post liked successfully");

    const secondResponse = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId });
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.message).toBe("Post unliked successfully");

    const thirdResponse = await request(app)
      .post(`/api/post/${postsList[0]._id}/like`)
      .send({ userId });
    expect(thirdResponse.status).toBe(200);
    expect(thirdResponse.body.message).toBe("Post liked successfully");

    const updatedPost = await Post.findById(postsList[0]._id);
    expect(updatedPost).not.toBeNull();
    expect(updatedPost!.likes.map((like) => like.toString())).toContain(userId);
    expect(updatedPost!.likes).toHaveLength(1);
  });
});
