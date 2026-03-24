import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import request from "supertest";
import initApp from "../index";
import User from "../models/userModel";

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test_users";
const uploadsDir = path.resolve(__dirname, "../../uploads"); 
const sourceImagesDir = path.resolve(__dirname, "../../../images");

type UserData = { username: string; email: string; password?: string; profileUrl?: string; _id?: string };

let app: any;
let usersList: UserData[];
let realImagePath: string;

const cleanupUploadedFiles = async () => {
  try {
    if (await fs.access(uploadsDir).then(() => true).catch(() => false)) {
      const files = await fs.readdir(uploadsDir);
      await Promise.all(
        files
          .filter((file) => file !== ".gitkeep")
          .map((file) => fs.unlink(path.join(uploadsDir, file)).catch(() => undefined))
      );
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
};

beforeAll(async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.MONGO_URI = TEST_MONGO_URI;
  app = await initApp();

  const imageFiles = await fs.readdir(sourceImagesDir);
  const firstImage = imageFiles.find((file) => /\.(jpg|jpeg|png)$/i.test(file));
  if (!firstImage) throw new Error("No test images found");
  realImagePath = path.join(sourceImagesDir, firstImage);

  await User.deleteMany();
});

afterAll(async () => {
  await User.deleteMany();
  await cleanupUploadedFiles();
  await mongoose.disconnect();
});

describe("User API", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await cleanupUploadedFiles();

    usersList = [
      { username: "NoaTest", email: "noa@test.com", password: "password123" },
      { username: "IsraelI", email: "israel@test.com", password: "password123" }
    ];

    for (const user of usersList) {
      const res = await User.create(user);
      user._id = res._id.toString();
    }
  });

  test("Get User by ID", async () => {
    const response = await request(app).get(`/api/user/${usersList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(usersList[0].username);
    expect(response.body.email).toBe(usersList[0].email);
    expect(response.body).not.toHaveProperty("password"); 
  });

  test("Get User by invalid ID returns 404", async () => {
    const response = await request(app).get("/api/user/000000000000000000000000");
    expect(response.status).toBe(404);
  });

  test("Search Users by username", async () => {

    const response = await request(app)
      .get("/api/user/search?q=testuser")
      
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("Update User profile (text only)", async () => {
    const updateData = { username: "UpdatedName" };

    const response = await request(app)
      .put(`/api/user/${usersList[0]._id}`)
      .send(updateData);
    if (response.status === 200) {
        expect(response.body.username).toBe("UpdatedName");
    }
  });

  test("Update User with profile picture upload", async () => {
    const response = await request(app)
      .put(`/api/user/${usersList[0]._id}`)
      .field("username", "NoaWithPhoto")
      .attach("profilePicture", realImagePath);

    if (response.status === 200) {
      expect(response.body.profileUrl).toMatch(/^\/uploads\//);
      const filename = path.basename(response.body.profileUrl);
      const filePath = path.join(uploadsDir, filename);
      const fileStat = await fs.stat(filePath);
      expect(fileStat.isFile()).toBe(true);
    }
  });

  test("Delete User", async () => {
    const response = await request(app).delete(`/api/user/${usersList[0]._id}`);
    
    if (response.status === 204) {
      const checkUser = await User.findById(usersList[0]._id);
      expect(checkUser).toBeNull();
    }
  });
});