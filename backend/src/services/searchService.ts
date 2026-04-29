import { Document, Types } from "mongoose";
import Post from "../models/postModel";
import { ParsedQuery } from "./llmService";

type LeanLikedPost = {
  _id: Types.ObjectId;
  text?: unknown;
};

type SearchPostsOptions = {
  page: number;
  limit: number;
};

type SearchPostsResult = {
  posts: Document[];
  totalPosts: number;
};

class SearchService {
  async searchPosts(
    parsedQuery: ParsedQuery,
    { page, limit }: SearchPostsOptions,
  ): Promise<SearchPostsResult> {
    try {
      const mongoQuery: Record<string, unknown> = {};
      const safePage = page > 0 ? page : 1;
      const safeLimit = limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      if (parsedQuery.keywords && parsedQuery.keywords.length > 0) {
        const regexes = parsedQuery.keywords.map((kw) => ({
          text: { $regex: kw, $options: "i" },
        }));
        mongoQuery["$or"] = regexes;
      }

      const [results, totalPosts] = await Promise.all([
        Post.find(mongoQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .populate("author", "username profileUrl"),
        Post.countDocuments(mongoQuery),
      ]);

      return {
        posts: results as Document[],
        totalPosts,
      };
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
    const likedPosts = await this.getUserLikedPostsForRecommendations(userId);

    return likedPosts.map((post) => post.text);
  }

  async getUserLikedPostsForRecommendations(userId: string): Promise<Array<{ id: string; text: string }>> {
    const likedPosts = await Post.find({ likes: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("_id text")
      .lean<LeanLikedPost[]>();

    return likedPosts
      .filter((post) => typeof post.text === "string" && post.text.trim().length > 0)
      .map((post) => ({
        id: String(post._id),
        text: (post.text as string).trim(),
      }));
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
