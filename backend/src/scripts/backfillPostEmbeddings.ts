import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "../models/postModel";
import ragService from "../services/ragService";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.dev",
});

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(mongoUri);
  const posts = await Post.find().select("_id").lean<{ _id: mongoose.Types.ObjectId }[]>();

  for (const post of posts) {
    await ragService.rebuildPostEmbeddings(String(post._id));
  }

  console.log(`Backfilled embeddings for ${posts.length} posts`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Embedding backfill failed:", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
