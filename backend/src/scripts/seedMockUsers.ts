import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel";

dotenv.config({ path: ".env.dev" });

const mockUsers = [
  {
    username: "alice",
    email: "alice@test.com",
    password: "password123",
    profileUrl: "/public/uploads/avatars/mock-alice.png",
  },
  {
    username: "bob",
    email: "bob@test.com",
    password: "password123",
    profileUrl: "/public/uploads/avatars/mock-bob.png",
  },
  {
    username: "carol",
    email: "carol@test.com",
    password: "password123",
    profileUrl: "/public/uploads/avatars/mock-carol.png",
  },
];

const seedMockUsers = async (): Promise<Record<string, string>> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(mongoUri);

  try {
    await User.deleteMany({});

    const insertedUsers = (await User.insertMany(mockUsers)) as Array<{
      username: string;
      _id: mongoose.Types.ObjectId;
    }>;

    const idsByUsername: Record<string, string> = {};
    for (const user of insertedUsers) {
      idsByUsername[user.username] = String(user._id);
    }

    console.log(`Inserted ${insertedUsers.length} mock users`);
    console.log("Mock user ids by username:", idsByUsername);
    return idsByUsername;
  } finally {
    await mongoose.disconnect();
  }
};

seedMockUsers().catch((error) => {
  console.error("Failed to seed mock users:", error);
  process.exit(1);
});

