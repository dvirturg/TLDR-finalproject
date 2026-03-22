import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import Comment from "../models/commentModel";
import Post from "../models/postModel";

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test";

type PostData = { text: string; author: string; _id?: string };
type CommentData = { text: string; author: string; postId: string; _id?: string };

let app: any;
let postsList: PostData[];
let commentsList: CommentData[];

const createPost = async (post: PostData) => {
  const response = await request(app).post("/api/post").send(post);
  return response;
};

const createComment = async (comment: CommentData) => {
  const response = await request(app).post("/api/comment").send(comment);
  return response;
};

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.MONGO_URI = TEST_MONGO_URI;
  app = await initApp();
  await Comment.deleteMany();
  await Post.deleteMany();
});

afterAll(async () => {
  await Comment.deleteMany();
  await Post.deleteMany();
  await mongoose.disconnect();
});

describe("Comment API", () => {
  beforeEach(async () => {
    await Comment.deleteMany();
    await Post.deleteMany();

    const authorA = new mongoose.Types.ObjectId().toString();
    const authorB = new mongoose.Types.ObjectId().toString();

    postsList = [
      { text: "first post", author: authorA },
      { text: "second post", author: authorB },
    ];

    for (const post of postsList) {
      const response = await createPost(post);
      post._id = response.body._id || response.body.id;
    }

    commentsList = [
      { text: "first comment", author: authorA, postId: postsList[0]._id! },
      { text: "second comment", author: authorB, postId: postsList[0]._id! },
      { text: "third comment", author: authorA, postId: postsList[1]._id! },
    ];

    for (const comment of commentsList) {
      const response = await createComment(comment);
      comment._id = response.body._id || response.body.id;
    }
  });

  test("Create Comment", async () => {
    const author = new mongoose.Types.ObjectId().toString();

    const response = await request(app).post("/api/comment").send({
      text: "new comment",
      author,
      postId: postsList[0]._id,
    });

    expect(response.status).toBe(201);
    expect(response.body.text).toBe("new comment");
    expect(response.body.author).toBe(author);
    expect(response.body.postId).toBe(postsList[0]._id);

    const savedComment = await Comment.findById(response.body._id);
    expect(savedComment).not.toBeNull();
    expect(savedComment!.text).toBe("new comment");
  });

  test("Get Comments By Post", async () => {
    const response = await request(app).get(`/api/comment/post/${postsList[0]._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].postId).toBe(postsList[0]._id);
    expect(response.body[1].postId).toBe(postsList[0]._id);
  });

  test("Get Comments By Post returns empty array for post with no comments", async () => {
    const thirdPost = await createPost({
      text: "third post",
      author: new mongoose.Types.ObjectId().toString(),
    });

    const response = await request(app).get(`/api/comment/post/${thirdPost.body._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("Get Comment By ID", async () => {
    const response = await request(app).get(`/api/comment/${commentsList[0]._id}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(commentsList[0]._id);
    expect(response.body.text).toBe(commentsList[0].text);
    expect(response.body.author).toBe(commentsList[0].author);
    expect(response.body.postId).toBe(commentsList[0].postId);
  });

  test("Get Comment By missing ID returns 404", async () => {
    const response = await request(app).get("/api/comment/000000000000000000000000");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("Update Comment", async () => {
    const response = await request(app)
      .put(`/api/comment/${commentsList[0]._id}`)
      .send({ text: "updated comment" });

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(commentsList[0]._id);
    expect(response.body.text).toBe("updated comment");

    const updatedComment = await Comment.findById(commentsList[0]._id);
    expect(updatedComment).not.toBeNull();
    expect(updatedComment!.text).toBe("updated comment");
  });

  test("Update non-existent Comment returns 404", async () => {
    const response = await request(app)
      .put("/api/comment/000000000000000000000000")
      .send({ text: "should not work" });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  test("Delete Comment", async () => {
    const response = await request(app).delete(`/api/comment/${commentsList[0]._id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Comment deleted successfully");

    const deletedComment = await Comment.findById(commentsList[0]._id);
    expect(deletedComment).toBeNull();
  });

  test("Delete non-existent Comment returns 404", async () => {
    const response = await request(app).delete("/api/comment/000000000000000000000000");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
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
      author: new mongoose.Types.ObjectId().toString(),
      postId: new mongoose.Types.ObjectId().toString(),
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/post not found/i);

    const savedComment = await Comment.findOne({ text: "comment on fake post" });
    expect(savedComment).toBeNull();
  });
});
