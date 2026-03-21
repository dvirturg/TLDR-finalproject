
import request from "supertest";
import initApp from "../index";
import Post from "../models/postModel";
import mongoose from "mongoose";

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test";

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  await mongoose.connect(TEST_MONGO_URI);
  await Post.deleteMany();
});

afterAll(async () => {
  await Post.deleteMany();
  await mongoose.disconnect();
});


type PostData = { text: string; author: string; _id?: string };
let postsList: PostData[];

let app: any;

describe("Sample Test Suite", () => {
  beforeEach(async () => {
    await mongoose.connect(TEST_MONGO_URI);
    await Post.deleteMany();
    // Initialize app for each test
    app = await initApp();
    const dummyAuthor = new mongoose.Types.ObjectId().toString();
    postsList = [
      { text: "this is my post", author: dummyAuthor },
      { text: "this is my second post", author: dummyAuthor },
      { text: "this is my third post", author: dummyAuthor },
      { text: "this is my fourth post", author: dummyAuthor },
    ];
    // Save posts and store their IDs
    for (let i = 0; i < postsList.length; i++) {
      const response = await request(app).post("/api/post").send(postsList[i]);
      postsList[i]._id = response.body._id || response.body.id;
    }
  });

  test("Create Post", async () => {
    const response = await request(app).get("/api/post");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
    for (let i = 0; i < postsList.length; i++) {
      expect(response.body[i].text).toBe(postsList[i].text);
      expect(response.body[i].author).toBe(postsList[i].author);
    }
  });

  test("Get All Posts", async () => {
    const response = await request(app).get("/api/post");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
  });

  test("Get Posts by sender", async () => {
    const response = await request(app).get(
      `/api/post?author=${postsList[0].author}`
    );
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(postsList.length);
    expect(response.body[0].text).toBe(postsList[0].text);
  });

  test("Get Post by ID", async () => {
    const response = await request(app).get("/api/post/" + postsList[0]._id);
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
      .put("/api/post/" + postsList[0]._id)
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
    const response = await request(app).delete("/api/post/" + postsList[0]._id);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Post deleted successfully");

    const getResponse = await request(app).get("/api/post/" + postsList[0]._id);
    expect(getResponse.status).toBe(404);
  });

  test("Delete non-existent Post returns 404", async () => {
    const response = await request(app).delete("/api/post/000000000000000000000000");
    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("Create Post with missing fields returns 500 or 400", async () => {
    const response = await request(app).post("/api/post").send({});
    expect([400, 500]).toContain(response.status);
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
