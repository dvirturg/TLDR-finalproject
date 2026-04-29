import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import Post from "../models/postModel";
import { Types } from "mongoose";
import { AuthRequest } from "../types/auth";
import searchService from "../services/searchService";
import llmService from "../services/llmService";
import { getCommentCountMap, toPostDTO } from "../utils/postSerializer";

const removeUploadedFile = async (filePath?: string) => {
  if (!filePath) {
    return;
  }
  await fs.unlink(path.resolve(filePath)).catch(() => undefined);
};

const serializePosts = async (posts: any[], currentUserId?: string) => {
  const countMap = await getCommentCountMap(posts.map((post) => post._id as Types.ObjectId));
  return posts.map((post) => toPostDTO(post, countMap.get(String(post._id)) ?? 0, currentUserId));
};

const getGenericRecommendationFeed = async (userId: string) => {
  return Post.find({
    author: { $ne: new Types.ObjectId(userId) },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("author", "username profileUrl");
};

export const postController = {
  async createPost(req: AuthRequest, res: Response) {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    const author = req.user?.sub;
    const imageUrl = req.file ? `/public/uploads/posts/${req.file.filename}` : "";

    if (!text || !author) {
      await removeUploadedFile(req.file?.path);
      res.status(400).json({ message: "text and authentication are required" });
      return;
    }

    try {
      const newPost = await Post.create({ text, author, imageUrl });
      const populatedPost = await Post.findById(newPost._id).populate("author", "username profileUrl");
      const serializedPost = await serializePosts([populatedPost], author);
      res.status(201).json(serializedPost[0]);
    } catch (err) {
      await removeUploadedFile(req.file?.path);
      console.error(err);
      res.status(500).json({ message: "Error creating post" });
    }
  },

  async getAllPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const { page: _p, ...filters } = req.query;

      const posts = await Post.find(filters)
        .populate("author", "username profileUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments(filters);
      
      const currentUserId = (req as AuthRequest).user?.sub;
      const safePosts = await serializePosts(posts, currentUserId);

      return res.json({
        data: safePosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page * limit < totalPosts
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving posts" });
    }
  },

  async searchPosts(req: AuthRequest, res: Response) {
    try {
      const query = (req.query.q as string | undefined)?.trim() ?? "";
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      // Simple regex search
      const regexPattern = new RegExp(query, "i");
      const regexPosts = await Post.find({ text: regexPattern })
        .populate("author", "username profileUrl")
        .sort({ createdAt: -1 });

      // AI-powered search
      const parsedQuery = await llmService.parseSearchQuery(query);
      const { posts: aiPosts } = await searchService.searchPosts(parsedQuery, { page, limit });

      // Compose results: combine and deduplicate by ID
      const postsMap = new Map();
      [...regexPosts, ...aiPosts].forEach((post) => {
        if (!postsMap.has(post._id.toString())) {
          postsMap.set(post._id.toString(), post);
        }
      });

      const composedPosts = Array.from(postsMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice((page - 1) * limit, page * limit);

      const safePosts = await serializePosts(composedPosts, userId);
      const totalPosts = postsMap.size;

      return res.json({
        posts: safePosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page * limit < totalPosts,
        },
      });
    } catch (error) {
      console.error("Search Error:", error);
      return res.status(500).json({ message: "Search operation failed" });
    }
  },

  async getPostById(req: Request, res: Response) {
    const postId = req.params.id;
    try {
      const post = await Post.findById(postId).populate("author", "username profileUrl");
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const currentUserId = (req as AuthRequest).user?.sub;
      const serializedPost = await serializePosts([post], currentUserId);
      return res.json(serializedPost[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving post" });
    }
  },

  async getPostsByUserId(req: Request, res: Response) {
    const userId = req.params.userId;
    try {
      const posts = await Post.find({ author: userId })
        .populate("author", "username profileUrl")
        .sort({ createdAt: -1 });

      const currentUserId = (req as AuthRequest).user?.sub;
      const safePosts = await serializePosts(posts, currentUserId);
      return res.json(safePosts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving user posts" });
    }
  },

  async updatePostById(req: AuthRequest, res: Response) {
    const postId = req.params.id;
    const updateData = { ...req.body };
    
    try {
      const post = await Post.findById(postId);
      if (!post) {
        if (req.file) await removeUploadedFile(req.file.path);
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.author.toString() !== req.user?.sub) {
        if (req.file) await removeUploadedFile(req.file.path);
        return res.status(403).json({ message: "You can only update your own posts" });
      }

      if (req.file) {
        const oldImagePath = post.imageUrl;
        updateData.imageUrl = `/public/uploads/posts/${req.file.filename}`;
        if (oldImagePath && oldImagePath.startsWith("/public/")) {
          const absoluteOldPath = path.join(__dirname, "../../", oldImagePath);
          await fs.unlink(absoluteOldPath).catch(() => undefined);
        }
      }

      const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
        returnDocument: "after",
      }).populate("author", "username profileUrl");

      const currentUserId = req.user?.sub;
      const serializedPost = await serializePosts([updatedPost], currentUserId);
      return res.json(serializedPost[0]);
    } catch (err) {
      if (req.file) await removeUploadedFile(req.file.path);
      console.error(err);
      return res.status(500).json({ message: "Error updating post" });
    }
  },

  async deletePostById(req: AuthRequest, res: Response) {
    const postId = req.params.id;
    try {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.author.toString() !== req.user?.sub) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      await Post.findByIdAndDelete(postId);
      return res.json({ message: "Post deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting post" });
    }
  },

  async likePost(req: AuthRequest, res: Response) {
    const postId = req.params.id;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    try {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const likeIndex = post.likes.findIndex((like: any) => like.toString() === userId);

      if (likeIndex !== -1) {
        post.likes.splice(likeIndex, 1);
        await post.save();
        const populatedPost = await Post.findById(postId).populate("author", "username profileUrl");
        const serializedPost = await serializePosts([populatedPost], userId);
        return res.json(serializedPost[0]);
      }

      post.likes.push(new Types.ObjectId(userId));

      await post.save();
      const populatedPost = await Post.findById(postId).populate("author", "username profileUrl");
      const serializedPost = await serializePosts([populatedPost], userId);
      return res.json(serializedPost[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error toggling post like" });
    }
  },

  async getRecommendedPosts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const likedTexts = await searchService.getUserLikedPostTexts(userId);
      console.log("Liked post texts for user", userId, ":", likedTexts);

      let recommendedPosts: any[];
      let usingFallback = false;

      if (likedTexts.length === 0) {
        recommendedPosts = await getGenericRecommendationFeed(userId);
        console.log("recommendedPosts based on generic feed:", recommendedPosts.map(p => p._id));
      } else {
        const { keywords } = await llmService.extractInterestsFromLikes(likedTexts);
        console.log("Extracted keywords for user", userId, ":", keywords);
        
        if (keywords.length > 0) {
          recommendedPosts = await searchService.getRecommendedPostsByKeywords(userId, keywords);
        } else {
          // LLM returned empty keywords - using fallback
          recommendedPosts = await getGenericRecommendationFeed(userId);
          usingFallback = true;
        }
      }

      const totalPosts = recommendedPosts.length;
      const paginatedPosts = recommendedPosts.slice(skip, skip + limit);
      const safeData = await serializePosts(paginatedPosts, userId);
      console.log("Returning recommended posts for user", userId, ":", safeData.map(p => p.id));
      
      return res.json({ 
        data: safeData,
        pages: Math.ceil(totalPosts / limit),
        usingFallback
      });
    } catch (error) {
      console.error("Recommendation Error:", error);
      // Return generic feed on error with fallback flag
      try {
        const userId = req.user?.sub;
        if (userId) {
          const fallbackPosts = await getGenericRecommendationFeed(userId);
          const page = parseInt(req.query.page as string) || 1;
          const limit = 10;
          const skip = (page - 1) * limit;
          const paginatedPosts = fallbackPosts.slice(skip, skip + limit);
          const safeData = await serializePosts(paginatedPosts, userId);
          return res.json({ 
            data: safeData,
            pages: Math.ceil(fallbackPosts.length / limit),
            usingFallback: true
          });
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
      return res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  },
};
