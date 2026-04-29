import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import request from "supertest";
const mockVerifyIdToken = jest.fn();

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

import initApp from "../index";
import User from "../models/userModel";
import { generateTokens } from "../utils/authUtils"; // Updated import

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test_users";
const uploadsDir = path.resolve(__dirname, "../../uploads"); 
const sourceImagesDir = path.resolve(__dirname, "../../../images");

type UserData = { username: string; email: string; password?: string; profileUrl?: string; _id?: string; token?: string };

let app: any;
let usersList: UserData[];

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
  process.env.JWT_SECRET = "secret_key"; 
  process.env.JWT_REFRESH_SECRET = "refresh_secret_key"; // Added refresh secret
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
  app = await initApp();

  const imageFiles = await fs.readdir(sourceImagesDir);
  const firstImage = imageFiles.find((file) => /\.(jpg|jpeg|png)$/i.test(file));
  if (!firstImage) throw new Error("No test images found");
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
    mockVerifyIdToken.mockReset();

    usersList = [
      { username: "NoaTest", email: "noa@test.com", password: "password123" },
      { username: "IsraelI", email: "israel@test.com", password: "password123" }
    ];

    for (const user of usersList) {
      const res = await User.create(user);
      user._id = res._id.toString();
      const tokens = generateTokens(user._id, user.username);
      user.token = tokens.accessToken;
    }
  });

  test("Register a new user", async () => {
    const newUser = { username: "Newbie", email: "new@test.com", password: "password123" };
    const response = await request(app).post("/api/user/register").send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken"); // Check for refresh token
    expect(response.body.user.username).toBe("Newbie");
  });

  test("Login existing user", async () => {
    const response = await request(app).post("/api/user/login").send({
      email: usersList[0].email,
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken"); // Check for refresh token
  });

  test("Google login creates a new user", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-1",
        email: "google-new@test.com",
        email_verified: true,
        name: "Google New",
        picture: "https://example.com/avatar.png",
      }),
    });

    const response = await request(app)
      .post("/api/user/google-login")
      .send({ idToken: "valid-google-token" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken"); // Check for refresh token
    expect(response.body.user.email).toBe("google-new@test.com");
    expect(response.body.user.username).toBe("googlenew");
    expect(response.body.user.profileUrl).toBe("https://example.com/avatar.png");

    const user = await User.findOne({ email: "google-new@test.com" });
    expect(user).not.toBeNull();
    expect(user?.authProvider).toBe("google");
    expect(user?.googleId).toBe("google-user-1");
  });

  test("Get User by ID", async () => {
    const response = await request(app).get(`/api/user/${usersList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(usersList[0].username);
    expect(response.body).not.toHaveProperty("password"); 
    expect(response.body).not.toHaveProperty("refreshTokens"); // Security check
  });

  test("Search Users by username (Requires Authentication)", async () => {
    const response = await request(app)
      .get("/api/user/search?q=Israel")
      .set("Authorization", `Bearer ${usersList[0].token}`);
      
    expect(response.status).toBe(200);
    expect(response.body.some((u: any) => u.username === "IsraelI")).toBe(true);
  });

  test("Update User profile (Requires Authentication)", async () => {
    const updateData = { username: "UpdatedName" };

    const response = await request(app)
      .put(`/api/user/${usersList[0]._id}`)
      .set("Authorization", `Bearer ${usersList[0].token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe("UpdatedName");
  });

  test("Delete User (Only self)", async () => {
    const response = await request(app)
      .delete(`/api/user/${usersList[0]._id}`)
      .set("Authorization", `Bearer ${usersList[0].token}`);
    
    expect(response.status).toBe(204);
    const checkUser = await User.findById(usersList[0]._id);
    expect(checkUser).toBeNull();
  });

  test("Fail to delete other user", async () => {
    const response = await request(app)
      .delete(`/api/user/${usersList[1]._id}`)
      .set("Authorization", `Bearer ${usersList[0].token}`);
    
    expect(response.status).toBe(403); 
  });
});