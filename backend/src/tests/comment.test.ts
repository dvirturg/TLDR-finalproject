import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Comment from "../models/commentModel";
import Post from "../models/postModel";
import User from "../models/userModel"; 

const TEST_MONGO_URI = "mongodb://localhost:27017/test_db";

type PostData = { text: string; author: string; _id?: string };
type CommentData = { text: string; author: string; postId: string; _id?: string };

let app: any;
let postsList: PostData[];
let commentsList: CommentData[];
let userIds: string[] = [];

const createPost = async (post: PostData) => {
  return await request(app).post("/api/post").send(post);
};

const createComment = async (comment: CommentData) => {
  return await request(app).post("/api/comment").send(comment);
};

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.MONGO_URI = TEST_MONGO_URI;
  app = await initApp();
  await User.deleteMany();
  await Comment.deleteMany();
  await Post.deleteMany();
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

    postsList = [
      { text: "first post", author: userIds[0] },
      { text: "second post", author: userIds[1] },
    ];

    for (const post of postsList) {
      const response = await createPost(post);
      post._id = response.body._id;
    }

    commentsList = [
      { text: "first comment", author: userIds[0], postId: postsList[0]._id! },
      { text: "second comment", author: userIds[1], postId: postsList[0]._id! },
    ];

    for (const comment of commentsList) {
      const response = await createComment(comment);
      comment._id = response.body._id;
    }
  });

  test("Create Comment and verify populate", async () => {
    const response = await request(app).post("/api/comment").send({
      text: "new comment",
      author: userIds[0],
      postId: postsList[0]._id,
    });

    expect(response.status).toBe(201);
    expect(response.body.text).toBe("new comment");
    
    expect(response.body.author._id).toBe(userIds[0]);
    expect(response.body.author.username).toBe("User1");
    expect(response.body.postId).toBe(postsList[0]._id);
  });

  test("Get Comments By Post with populate", async () => {
    const response = await request(app).get(`/api/comment/post/${postsList[0]._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].author).toHaveProperty("username");
    expect(response.body[0].postId).toBe(postsList[0]._id);
  });

  test("Get Comment By ID and verify author object", async () => {
    const response = await request(app).get(`/api/comment/${commentsList[0]._id}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(commentsList[0]._id);
    expect(response.body.author._id).toBe(commentsList[0].author);
    expect(response.body.author.username).toBe("User1");
  });

  test("Update Comment", async () => {
    const response = await request(app)
      .put(`/api/comment/${commentsList[0]._id}`)
      .send({ text: "updated comment" });

    expect(response.status).toBe(200);
    expect(response.body.text).toBe("updated comment");
    expect(response.body.author).toHaveProperty("username");
  });

  test("Delete Comment", async () => {
    const response = await request(app).delete(`/api/comment/${commentsList[0]._id}`);
    expect(response.status).toBe(200);
    
    const deletedComment = await Comment.findById(commentsList[0]._id);
    expect(deletedComment).toBeNull();
  });

  test("Create Comment with missing fields returns 400", async () => {
    const response = await request(app).post("/api/comment").send({
      text: "missing postId",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/text, author and postId are required/i);
  });

  test("Create Comment rejects non-existent postId", async () => {
    const response = await request(app).post("/api/comment").send({
      text: "comment on fake post",
      author: userIds[0],
      postId: new mongoose.Types.ObjectId().toString(),
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/post not found/i);
  });
});