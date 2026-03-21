import fs from "fs/promises";
import path from "path";
import { Request, Response } from "express";
import Post from "../models/postModel";

const removeUploadedFile = async (filePath?: string) => {
  if (!filePath) {
    return;
  }
  await fs.unlink(path.resolve(filePath)).catch(() => undefined);
};

export const postController = {
  async createPost(req: Request, res: Response) {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const author = typeof req.body.author === "string" ? req.body.author.trim() : "";
    const imageUrl = req.file ? `/public/uploads/posts/${req.file.filename}` : "";

    if (!text || !author) {
      await removeUploadedFile(req.file?.path);
      res.status(400).json({ message: "text and author are required" });
      return;
    }

    try {
      const newPost = await Post.create({ text, author, imageUrl });
      res.status(201).json(newPost);
    } catch (err) {
      await removeUploadedFile(req.file?.path);
      console.error(err);
      res.status(500).json({ message: "Error creating post" });
    }
  },

  async getAllPosts(req: Request, res: Response) {
    try {
      if (Object.keys(req.query).length > 0) {
        const filterData = await Post.find(req.query);
        return res.json(filterData);
      }

      const allPosts = await Post.find();
      return res.json(allPosts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving posts" });
    }
  },

  async getPostById(req: Request, res: Response) {
    const postId = req.params.id;
    try {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      return res.json(post);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving post" });
    }
  },

  async updatePostById(req: Request, res: Response) {
    const postId = req.params.id;
    const updateData = req.body;
    try {
      const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { returnDocument: "after" });
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      return res.json(updatedPost);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating post" });
    }
  },

  async deletePostById(req: Request, res: Response) {
    const postId = req.params.id;
    try {
      const deletedPost = await Post.findByIdAndDelete(postId);
      if (!deletedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      return res.json({ message: "Post deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting post" });
    }
  },

  async likePost(req: Request, res: Response) {
    const postId = req.params.id;
    const userId = req.body.userId;
    try {
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const likeIndex = post.likes.findIndex((like) => like.toString() === userId);
      if (likeIndex !== -1) {
        post.likes.splice(likeIndex, 1);
        await post.save();
        return res.json({ message: "Post unliked successfully" });
      }

      post.likes.push(userId);
      await post.save();
      return res.json({ message: "Post liked successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error toggling post like" });
    }
  }
};
