import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Comment from "../models/commentModel";
import Post from "../models/postModel";
import User from "../models/userModel"; 
import { generateToken } from "../utils/authUtils";

const TEST_MONGO_URI = "mongodb://localhost:27017/test_db_comments";

type PostData = { text: string; author: string; _id?: string };
type CommentData = { text: string; author?: string; postId: string; _id?: string };

let app: any;
let postsList: PostData[];
let commentsList: CommentData[];
let tokens: string[] = [];
let userIds: string[] = [];

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.MONGO_URI = TEST_MONGO_URI;
  process.env.JWT_SECRET = "secret_key";
  app = await initApp();
});

afterAll(async () => {
  await User.deleteMany();
  await Comment.deleteMany();
  await Post.deleteMany();
  await mongoose.disconnect();
});

describe("Comment API", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await Comment.deleteMany();
    await Post.deleteMany();

    const user1 = await User.create({ username: "User1", email: "u1@t.com", password: "123" });
    const user2 = await User.create({ username: "User2", email: "u2@t.com", password: "123" });
    
    userIds = [user1._id.toString(), user2._id.toString()];
    tokens = [
      generateToken(userIds[0], user1.username),
      generateToken(userIds[1], user2.username)
    ];

    const postRes = await request(app)
      .post("/api/post")
      .set("Authorization", `Bearer ${tokens[0]}`)
      .send({ text: "first post" });
    
    postsList = [{ text: "first post", author: userIds[0], _id: postRes.body._id }];

    const commentRes1 = await request(app)
      .post("/api/comment")
      .set("Authorization", `Bearer ${tokens[0]}`)
      .send({ text: "first comment", postId: postsList[0]._id });

    const commentRes2 = await request(app)
      .post("/api/comment")
      .set("Authorization", `Bearer ${tokens[1]}`)
      .send({ text: "second comment", postId: postsList[0]._id });

    commentsList = [
      { text: "first comment", author: userIds[0], postId: postsList[0]._id!, _id: commentRes1.body._id },
      { text: "second comment", author: userIds[1], postId: postsList[0]._id!, _id: commentRes2.body._id }
    ];
  });

  test("Create Comment and verify author from token", async () => {
    const response = await request(app)
      .post("/api/comment")
      .set("Authorization", `Bearer ${tokens[0]}`)
      .send({
        text: "new comment",
        postId: postsList[0]._id,
      });

    expect(response.status).toBe(201);
    expect(response.body.author._id).toBe(userIds[0]);
    expect(response.body.author.username).toBe("User1");
  });

  test("Get Comments By Post (Public)", async () => {
    const response = await request(app).get(`/api/comment/post/${postsList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test("Update own comment", async () => {
    const response = await request(app)
      .put(`/api/comment/${commentsList[0]._id}`)
      .set("Authorization", `Bearer ${tokens[0]}`)
      .send({ text: "updated text" });

    expect(response.status).toBe(200);
    expect(response.body.text).toBe("updated text");
  });

  test("Fail to update other user's comment", async () => {
    const response = await request(app)
      .put(`/api/comment/${commentsList[0]._id}`)
      .set("Authorization", `Bearer ${tokens[1]}`) 
      .send({ text: "hacking text" });

    expect(response.status).toBe(403);
  });

  test("Delete own comment", async () => {
    const response = await request(app)
      .delete(`/api/comment/${commentsList[0]._id}`)
      .set("Authorization", `Bearer ${tokens[0]}`);

    expect(response.status).toBe(200);
    const deleted = await Comment.findById(commentsList[0]._id);
    expect(deleted).toBeNull();
  });

  test("Create Comment with missing postId returns 400", async () => {
    const response = await request(app)
      .post("/api/comment")
      .set("Authorization", `Bearer ${tokens[0]}`)
      .send({ text: "missing postId" });

    expect(response.status).toBe(400);
  });

  test("Create Comment without token returns 401", async () => {
    const response = await request(app)
      .post("/api/comment")
      .send({ text: "no token", postId: postsList[0]._id });

    expect(response.status).toBe(401);
  });
});