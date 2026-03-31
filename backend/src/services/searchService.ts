import { Document, Types } from "mongoose";
import Post from "../models/postModel";
import { ParsedQuery } from "./llmService";

type LeanLikedPost = {
  text?: unknown;
};

class SearchService {
  async searchPosts(parsedQuery: ParsedQuery): Promise<Document[]> {
    try {
      const mongoQuery: Record<string, unknown> = {};

      if (parsedQuery.keywords && parsedQuery.keywords.length > 0) {
        const regexes = parsedQuery.keywords.map((kw) => ({
          text: { $regex: kw, $options: "i" },
        }));
        mongoQuery["$or"] = regexes;
      }

      const results = await Post.find(mongoQuery)
        .sort({ createdAt: -1 })
        .populate("author", "username profileUrl");

      return results as Document[];
    } catch (error) {
      console.error("Search service error:", error);
      throw new Error("Search operation failed");
    }
  }

  async simpleTextSearch(query: string): Promise<Document[]> {
    try {
      const results = await Post.find({ text: { $regex: query, $options: "i" } })
        .sort({ createdAt: -1 })
        .populate("author", "username profileUrl");

      return results as Document[];
    } catch (error) {
      console.error("Simple search error:", error);
      return [];
    }
  }

  async getUserLikedPostTexts(userId: string): Promise<string[]> {
    const likedPosts = await Post.find({ likes: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("text")
      .lean<LeanLikedPost[]>();

    return likedPosts
      .map((post) => post.text)
      .filter((text): text is string => typeof text === "string" && text.trim().length > 0);
  }

  async getRecommendedPostsByKeywords(userId: string, keywords: string[]) {
    if (keywords.length === 0) {
      return [];
    }

    const regexes = keywords.map((kw) => ({
      text: { $regex: kw, $options: "i" },
    }));

    return Post.find({
      $and: [
        { $or: regexes },
        { author: { $ne: new Types.ObjectId(userId) } },
        { likes: { $ne: userId } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("author", "username profileUrl");
  }
}

export default new SearchService();
