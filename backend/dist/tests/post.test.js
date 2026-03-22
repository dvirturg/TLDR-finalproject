"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
const postModel_1 = __importDefault(require("../models/postModel"));
const postImageUpload_1 = require("../middleware/postImageUpload");
const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test";
const uploadsDir = path_1.default.resolve(__dirname, "../../public/uploads/posts");
const sourceImagesDir = path_1.default.resolve(__dirname, "../../../images");
let app;
let postsList;
let realImagePath;
const cleanupUploadedFiles = async () => {
    try {
        const files = await promises_1.default.readdir(uploadsDir);
        await Promise.all(files
            .filter((file) => file !== ".gitkeep")
            .map((file) => promises_1.default.unlink(path_1.default.join(uploadsDir, file))));
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};
const createJsonPost = async (post) => {
    const response = await (0, supertest_1.default)(app).post("/api/post").send(post);
    return response;
};
beforeAll(async () => {
    jest.spyOn(console, "error").mockImplementation(() => { });
    process.env.MONGO_URI = TEST_MONGO_URI;
    app = await (0, index_1.default)();
    const imageFiles = await promises_1.default.readdir(sourceImagesDir);
    const firstImage = imageFiles.find((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    if (!firstImage) {
        throw new Error(`No image files found in ${sourceImagesDir}`);
    }
    realImagePath = path_1.default.join(sourceImagesDir, firstImage);
    await postModel_1.default.deleteMany();
    await cleanupUploadedFiles();
});
afterAll(async () => {
    await postModel_1.default.deleteMany();
    await cleanupUploadedFiles();
    await mongoose_1.default.disconnect();
});
describe("Post API", () => {
    beforeEach(async () => {
        await postModel_1.default.deleteMany();
        await cleanupUploadedFiles();
        const dummyAuthor = new mongoose_1.default.Types.ObjectId().toString();
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
        const response = await (0, supertest_1.default)(app).get("/api/post");
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(postsList.length);
        for (let i = 0; i < postsList.length; i++) {
            expect(response.body[i].text).toBe(postsList[i].text);
            expect(response.body[i].author).toBe(postsList[i].author);
            expect(response.body[i].imageUrl).toBe("");
        }
    });
    test("Create Post with image upload", async () => {
        const author = new mongoose_1.default.Types.ObjectId().toString();
        const response = await (0, supertest_1.default)(app)
            .post("/api/post")
            .field("text", "post with image")
            .field("author", author)
            .attach("image", realImagePath);
        expect(response.status).toBe(201);
        expect(response.body.text).toBe("post with image");
        expect(response.body.author).toBe(author);
        expect(response.body.imageUrl).toMatch(/^\/public\/uploads\/posts\/post-\d+-\d+\.(jpg|jpeg|png|gif|webp)$/);
        const savedPost = await postModel_1.default.findById(response.body._id);
        expect(savedPost).not.toBeNull();
        expect(savedPost.imageUrl).toBe(response.body.imageUrl);
        const uploadedFilePath = path_1.default.join(uploadsDir, path_1.default.basename(response.body.imageUrl));
        const uploadedFileStat = await promises_1.default.stat(uploadedFilePath);
        expect(uploadedFileStat.isFile()).toBe(true);
    });
    test("Uploaded image is publicly reachable", async () => {
        const author = new mongoose_1.default.Types.ObjectId().toString();
        const createResponse = await (0, supertest_1.default)(app)
            .post("/api/post")
            .field("text", "public image")
            .field("author", author)
            .attach("image", realImagePath);
        expect(createResponse.status).toBe(201);
        const imageResponse = await (0, supertest_1.default)(app).get(createResponse.body.imageUrl);
        expect(imageResponse.status).toBe(200);
        expect(imageResponse.headers["content-type"]).toMatch(/^image\//);
    });
    test("Create Post rejects invalid image type", async () => {
        const author = new mongoose_1.default.Types.ObjectId().toString();
        const response = await (0, supertest_1.default)(app)
            .post("/api/post")
            .field("text", "bad image")
            .field("author", author)
            .attach("image", Buffer.from("not-an-image"), "bad-file.txt");
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/only image files are allowed/i);
    });
    test("Create Post rejects oversized image", async () => {
        const author = new mongoose_1.default.Types.ObjectId().toString();
        const response = await (0, supertest_1.default)(app)
            .post("/api/post")
            .field("text", "large image")
            .field("author", author)
            .attach("image", Buffer.alloc(postImageUpload_1.POST_IMAGE_MAX_FILE_SIZE + 1, 1), "large-image.png");
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/too large/i);
    });
    test("Get All Posts", async () => {
        const response = await (0, supertest_1.default)(app).get("/api/post");
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(postsList.length);
    });
    test("Get Posts by author", async () => {
        const response = await (0, supertest_1.default)(app).get(`/api/post?author=${postsList[0].author}`);
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(postsList.length);
        expect(response.body[0].text).toBe(postsList[0].text);
    });
    test("Get Post by ID", async () => {
        const response = await (0, supertest_1.default)(app).get(`/api/post/${postsList[0]._id}`);
        expect(response.status).toBe(200);
        expect(response.body.text).toBe(postsList[0].text);
        expect(response.body.author).toBe(postsList[0].author);
        expect(response.body._id).toBe(postsList[0]._id);
    });
    test("Get Post by invalid ID returns 404", async () => {
        const response = await (0, supertest_1.default)(app).get("/api/post/000000000000000000000000");
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/i);
    });
    test("Update Post", async () => {
        postsList[0].text = "This is an updated post";
        const response = await (0, supertest_1.default)(app)
            .put(`/api/post/${postsList[0]._id}`)
            .send(postsList[0]);
        expect(response.status).toBe(200);
        expect(response.body.text).toBe(postsList[0].text);
        expect(response.body.author).toBe(postsList[0].author);
        expect(response.body._id).toBe(postsList[0]._id);
    });
    test("Update non-existent Post returns 404", async () => {
        const response = await (0, supertest_1.default)(app)
            .put("/api/post/000000000000000000000000")
            .send({ text: "should not work" });
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/i);
    });
    test("Delete Post", async () => {
        const response = await (0, supertest_1.default)(app).delete(`/api/post/${postsList[0]._id}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("message", "Post deleted successfully");
        const getResponse = await (0, supertest_1.default)(app).get(`/api/post/${postsList[0]._id}`);
        expect(getResponse.status).toBe(404);
    });
    test("Delete non-existent Post returns 404", async () => {
        const response = await (0, supertest_1.default)(app).delete("/api/post/000000000000000000000000");
        expect(response.status).toBe(404);
        expect(response.body.message).toMatch(/not found/i);
    });
    test("Create Post with missing fields returns 400", async () => {
        const response = await (0, supertest_1.default)(app).post("/api/post").send({});
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/text and author are required/i);
    });
    test("Like Post", async () => {
        const userId = new mongoose_1.default.Types.ObjectId().toString();
        const response = await (0, supertest_1.default)(app)
            .post(`/api/post/${postsList[0]._id}/like`)
            .send({ userId });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Post liked successfully");
        const updatedPost = await postModel_1.default.findById(postsList[0]._id);
        expect(updatedPost).not.toBeNull();
        expect(updatedPost.likes.map((like) => like.toString())).toContain(userId);
    });
    test("Like Post toggles to unlike on second request", async () => {
        const userId = new mongoose_1.default.Types.ObjectId().toString();
        await (0, supertest_1.default)(app)
            .post(`/api/post/${postsList[0]._id}/like`)
            .send({ userId });
        const toggleResponse = await (0, supertest_1.default)(app)
            .post(`/api/post/${postsList[0]._id}/like`)
            .send({ userId });
        expect(toggleResponse.status).toBe(200);
        expect(toggleResponse.body.message).toBe("Post unliked successfully");
        const updatedPost = await postModel_1.default.findById(postsList[0]._id);
        expect(updatedPost).not.toBeNull();
        expect(updatedPost.likes.map((like) => like.toString())).not.toContain(userId);
        expect(updatedPost.likes).toHaveLength(0);
    });
    test("Like Post toggles like then unlike then like again", async () => {
        const userId = new mongoose_1.default.Types.ObjectId().toString();
        const firstResponse = await (0, supertest_1.default)(app)
            .post(`/api/post/${postsList[0]._id}/like`)
            .send({ userId });
        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.message).toBe("Post liked successfully");
        const secondResponse = await (0, supertest_1.default)(app)
            .post(`/api/post/${postsList[0]._id}/like`)
            .send({ userId });
        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body.message).toBe("Post unliked successfully");
        const thirdResponse = await (0, supertest_1.default)(app)
            .post(`/api/post/${postsList[0]._id}/like`)
            .send({ userId });
        expect(thirdResponse.status).toBe(200);
        expect(thirdResponse.body.message).toBe("Post liked successfully");
        const updatedPost = await postModel_1.default.findById(postsList[0]._id);
        expect(updatedPost).not.toBeNull();
        expect(updatedPost.likes.map((like) => like.toString())).toContain(userId);
        expect(updatedPost.likes).toHaveLength(1);
    });
});
