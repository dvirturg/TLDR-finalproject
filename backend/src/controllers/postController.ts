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
      res.status(201).json(populatedPost);
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
        posts: safePosts,
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

  async getPostById(req: Request, res: Response) {
    const postId = req.params.id;
    try {
      const post = await Post.findById(postId).populate("author", "username profileUrl");
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      return res.json(post);
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

      return res.json(posts);
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

      return res.json(updatedPost);
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
        return res.json({ message: "Post unliked successfully" });
      }

      post.likes.push(new Types.ObjectId(userId));

      await post.save();
      return res.json({ message: "Post liked successfully" });
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

      const likedTexts = await searchService.getUserLikedPostTexts(userId);

      let recommendedPosts: any[];
      if (likedTexts.length === 0) {
        recommendedPosts = await getGenericRecommendationFeed(userId);
      } else {
        const { keywords } = await llmService.extractInterestsFromLikes(likedTexts);
        recommendedPosts = keywords.length > 0
          ? await searchService.getRecommendedPostsByKeywords(userId, keywords)
          : await getGenericRecommendationFeed(userId);
      }

      const safeData = await serializePosts(recommendedPosts, userId);
      return res.json({ data: safeData });
    } catch (error) {
      console.error("Recommendation Error:", error);
      return res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  },
};
