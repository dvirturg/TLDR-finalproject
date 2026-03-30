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
import { generateToken } from "../utils/authUtils"; // ייבוא פונקציית העזר

const TEST_MONGO_URI = "mongodb://localhost:27017/tldr_test_users";
const uploadsDir = path.resolve(__dirname, "../../uploads"); 
const sourceImagesDir = path.resolve(__dirname, "../../../images");

type UserData = { username: string; email: string; password?: string; profileUrl?: string; _id?: string; token?: string };

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
  process.env.JWT_SECRET = "secret_key"; 
  process.env.GOOGLE_CLIENT_ID = "google-client-id";
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
    mockVerifyIdToken.mockReset();

    usersList = [
      { username: "NoaTest", email: "noa@test.com", password: "password123" },
      { username: "IsraelI", email: "israel@test.com", password: "password123" }
    ];

    for (const user of usersList) {
      const res = await User.create(user);
      user._id = res._id.toString();
      user.token = generateToken(user._id, user.username);
    }
  });

  
  test("Register a new user", async () => {
    const newUser = { username: "Newbie", email: "new@test.com", password: "password123" };
    const response = await request(app).post("/api/user/register").send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body.user.username).toBe("Newbie");
  });

  test("Login existing user", async () => {
    const response = await request(app).post("/api/user/login").send({
      email: usersList[0].email,
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
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
    expect(response.body.user.email).toBe("google-new@test.com");
    expect(response.body.user.username).toBe("googlenew");
    expect(response.body.user.profileUrl).toBe("https://example.com/avatar.png");

    const user = await User.findOne({ email: "google-new@test.com" });
    expect(user).not.toBeNull();
    expect(user?.authProvider).toBe("google");
    expect(user?.googleId).toBe("google-user-1");
    expect(user?.password).toBeUndefined();
  });

  test("Google login links an existing local-email user", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-2",
        email: usersList[0].email,
        email_verified: true,
        name: "Noa Test",
      }),
    });

    const response = await request(app)
      .post("/api/user/google-login")
      .send({ idToken: "valid-google-token" });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(usersList[0]._id);
    expect(response.body.user.username).toBe(usersList[0].username);

    const updatedUser = await User.findById(usersList[0]._id);
    expect(updatedUser?.googleId).toBe("google-user-2");
    expect(updatedUser?.authProvider).toBe("google");
  });

  test("Google login rejects missing idToken", async () => {
    const response = await request(app)
      .post("/api/user/google-login")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Google idToken is required");
  });

  test("Google login rejects invalid Google credentials", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("invalid token"));

    const response = await request(app)
      .post("/api/user/google-login")
      .send({ idToken: "bad-token" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid Google credentials");
  });

  test("Google login rejects unverified email", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-3",
        email: "unverified@test.com",
        email_verified: false,
        name: "Unverified User",
      }),
    });

    const response = await request(app)
      .post("/api/user/google-login")
      .send({ idToken: "unverified-token" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid Google credentials");
  });

  test("Google login resolves username collisions", async () => {
    await User.create({
      username: "janedoe",
      email: "existing-jane@test.com",
      password: "password123",
    });

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-4",
        email: "new-jane@test.com",
        email_verified: true,
        name: "Jane Doe",
      }),
    });

    const response = await request(app)
      .post("/api/user/google-login")
      .send({ idToken: "collision-token" });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toMatch(/^janedoe\d+$/);
  });

  test("Get User by ID", async () => {
    const response = await request(app).get(`/api/user/${usersList[0]._id}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(usersList[0].username);
    expect(response.body).not.toHaveProperty("password"); 
  });

  test("Search Users by username (Requires Authentication)", async () => {
    const response = await request(app)
      .get("/api/user/search?q=Israel")
      .set("Authorization", `Bearer ${usersList[0].token}`); // הוספת הטוקן
      
    expect(response.status).toBe(200);
    expect(response.body.some((u: any) => u.username === "IsraelI")).toBe(true);
  });

  test("Update User profile (Requires Authentication)", async () => {
    const updateData = { username: "UpdatedName" };

    const response = await request(app)
      .put(`/api/user/${usersList[0]._id}`)
      .set("Authorization", `Bearer ${usersList[0].token}`) // הוספת הטוקן
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.username).toBe("UpdatedName");
  });

  test("Update User with profile picture upload", async () => {
    const response = await request(app)
      .put(`/api/user/${usersList[0]._id}`)
      .set("Authorization", `Bearer ${usersList[0].token}`) // הוספת הטוקן
      .field("username", "NoaWithPhoto")
      .attach("profilePicture", realImagePath);

    expect(response.status).toBe(200);
    expect(response.body.profileUrl).toMatch(/^\/uploads\//);
  });

  test("Delete User (Only self)", async () => {
    const response = await request(app)
      .delete(`/api/user/${usersList[0]._id}`)
      .set("Authorization", `Bearer ${usersList[0].token}`); // הוספת הטוקן
    
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
