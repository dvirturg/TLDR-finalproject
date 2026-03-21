"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const postModel_1 = __importDefault(require("../models/postModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test";
beforeAll(async () => {
    jest.spyOn(console, "error").mockImplementation(() => { });
    await mongoose_1.default.connect(TEST_MONGO_URI);
    await postModel_1.default.deleteMany();
});
afterAll(async () => {
    await postModel_1.default.deleteMany();
    await mongoose_1.default.disconnect();
});
let postsList;
let app;
describe("Sample Test Suite", () => {
    beforeEach(async () => {
        await mongoose_1.default.connect(TEST_MONGO_URI);
        await postModel_1.default.deleteMany();
        // Initialize app for each test
        app = await (0, index_1.default)();
        // Use a dummy sender for all posts
        const dummySender = "dummy_sender_id";
        postsList = [
            { content: "this is my post", sender: dummySender },
            { content: "this is my second post", sender: dummySender },
            { content: "this is my third post", sender: dummySender },
            { content: "this is my fourth post", sender: dummySender },
        ];
        // Save posts and store their IDs
        for (let i = 0; i < postsList.length; i++) {
            console.log(`Creating post:`, postsList[i]);
            const response = await (0, supertest_1.default)(app).post("/post").send(postsList[i]);
            console.log(`Response for created post:`, response.body);
            postsList[i]._id = response.body._id || response.body.id;
        }
    });
    test("Create Post", async () => {
        const response = await (0, supertest_1.default)(app).get("/post");
        console.log("GET /post response:", response.body);
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(postsList.length);
        for (let i = 0; i < postsList.length; i++) {
            expect(response.body[i].content).toBe(postsList[i].content);
            expect(response.body[i].sender).toBe(postsList[i].sender);
        }
    });
    /*
      test("Get All Posts", async () => {
        const response = await request(app).get("/post");
        console.log("GET /post (all) response:", response.body);
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(postsList.length);
      });
    
      test("Get Posts by sender", async () => {
        const response = await request(app).get(
          "/post?sender=dummy_sender_id"
        );
        console.log("GET /post?sender=dummy_sender_id response:", response.body);
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(postsList.length);
        expect(response.body[0].content).toBe(postsList[0].content);
      });
    
      test("Get Post by ID", async () => {
        const response = await request(app).get("/post/" + postsList[0]._id);
        console.log(`GET /post/${postsList[0]._id} response:`, response.body);
        expect(response.status).toBe(200);
        expect(response.body.content).toBe(postsList[0].content);
        expect(response.body.sender).toBe(postsList[0].sender);
        expect(response.body._id).toBe(postsList[0]._id);
      });
    
      test("Get Post by invalid ID returns 404", async () => {
        const response = await request(app).get("/post/000000000000000000000000");
        console.log("GET /post/000000000000000000000000 response:", response.body);
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/i);
      });
    
      test("Update Post", async () => {
        postsList[0].content = "This is an updated post";
        console.log("Updating post with:", postsList[0]);
        const response = await request(app)
          .put("/post/" + postsList[0]._id)
          .send(postsList[0]);
        console.log(`PUT /post/${postsList[0]._id} response:`, response.body);
        expect(response.status).toBe(200);
        expect(response.body.content).toBe(postsList[0].content);
        expect(response.body.sender).toBe(postsList[0].sender);
        expect(response.body._id).toBe(postsList[0]._id);
      });
    
      test("Update non-existent Post returns 404", async () => {
        const response = await request(app)
          .put("/post/000000000000000000000000")
          .send({ content: "should not work" });
        console.log("PUT /post/000000000000000000000000 response:", response.body);
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/i);
      });
    
      test("Delete Post", async () => {
        const response = await request(app).delete("/post/" + postsList[0]._id);
        console.log(`DELETE /post/${postsList[0]._id} response:`, response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "Post deleted successfully");
    
        const getResponse = await request(app).get("/post/" + postsList[0]._id);
        console.log(`GET /post/${postsList[0]._id} after delete response:`, getResponse.body);
        expect(getResponse.status).toBe(404);
      });
    
      test("Delete non-existent Post returns 404", async () => {
        const response = await request(app).delete("/post/000000000000000000000000");
        console.log("DELETE /post/000000000000000000000000 response:", response.body);
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/i);
      });
    
      test("Create Post with missing fields returns 500 or 400", async () => {
        const response = await request(app).post("/post").send({});
        console.log("POST /post with missing fields response:", response.body);
        expect([400, 500]).toContain(response.status);
      });
      */
});
