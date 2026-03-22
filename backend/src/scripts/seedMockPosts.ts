import dotenv from "dotenv";
import mongoose from "mongoose";
import Post from "../models/postModel";

dotenv.config({ path: ".env.dev" });

const mockAuthors = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

const mockPosts = [
  {
    text: "Just shipped the first version of the TL;DR backend.",
    imageUrl: "",
    author: mockAuthors[0],
    likes: [mockAuthors[1]],
  },
  {
    text: "Testing image upload flow with a seeded post.",
    imageUrl: "/public/uploads/posts/mock-sunrise.jpg",
    author: mockAuthors[1],
    likes: [mockAuthors[0], mockAuthors[2]],
  },
  {
    text: "Mongoose connection is stable, next step is cleaning the listeners.",
    imageUrl: "",
    author: mockAuthors[2],
    likes: [],
  },
  {
    text: "Swagger for posts is now wired up and ready for manual review.",
    imageUrl: "/public/uploads/posts/mock-swagger-board.jpg",
    author: mockAuthors[0],
    likes: [mockAuthors[2]],
  },
  {
    text: "This mock post exists so frontend timelines have enough volume to render properly.",
    imageUrl: "",
    author: mockAuthors[1],
    likes: [mockAuthors[0]],
  },
];

const seedMockPosts = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(mongoUri);

  try {
    await Post.deleteMany({});
    const insertedPosts = await Post.insertMany(mockPosts);
    console.log(`Inserted ${insertedPosts.length} mock posts`);
  } finally {
    await mongoose.disconnect();
  }
};

seedMockPosts().catch((error) => {
  console.error("Failed to seed mock posts:", error);
  process.exit(1);
});
