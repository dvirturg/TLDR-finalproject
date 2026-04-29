import mongoose, { Document, Types } from "mongoose";

export interface IPostEmbedding extends Document {
  postId: Types.ObjectId;
  chunkIndex: number;
  text: string;
  embedding: number[];
  embeddingModel: string;
  dimensions: number;
  source: "post";
  language: string;
  type: "post";
  createdAt: Date;
  updatedAt: Date;
}

const PostEmbeddingSchema = new mongoose.Schema<IPostEmbedding>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    embeddingModel: { type: String, required: true },
    dimensions: { type: Number, required: true },
    source: { type: String, enum: ["post"], default: "post", index: true },
    language: { type: String, default: "en", index: true },
    type: { type: String, enum: ["post"], default: "post", index: true },
  },
  { timestamps: true },
);

PostEmbeddingSchema.index({ postId: 1, chunkIndex: 1 }, { unique: true });
PostEmbeddingSchema.index({ source: 1, language: 1, type: 1 });

export default mongoose.model<IPostEmbedding>("PostEmbedding", PostEmbeddingSchema);
