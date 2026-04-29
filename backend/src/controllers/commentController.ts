import { Request, Response } from "express";
import Comment from "../models/commentModel";
import Post from "../models/postModel";
import { AuthRequest } from "../types/auth"; 

export const commentController = {
  async getCommentsByPost(req: Request, res: Response) {
    const postId = req.params.postId || req.query.postId;
    try {
      const comments = await Comment.find({ postId })
        .populate("author", "username profileUrl")
        .sort({ createdAt: -1 });

      return res.json(comments);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving comments" });
    }
  },

  async createComment(req: AuthRequest, res: Response) {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
    const postId = typeof req.body.postId === "string" ? req.body.postId.trim() : "";
    
    const author = req.user?.sub;

    if (!text || !author || !postId) {
      res.status(400).json({ message: "text and postId are required, and you must be logged in" });
      return;
    }

    try {
      const existingPost = await Post.findById(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const newComment = await Comment.create({ text, author, postId });
      const populatedComment = await Comment.findById(newComment._id).populate("author", "username profileUrl");
      
      return res.status(201).json(populatedComment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error creating comment" });
    }
  },

  async getCommentById(req: Request, res: Response) {
    const commentId = req.params.id;
    try {
      const comment = await Comment.findById(commentId).populate("author", "username profileUrl");
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      return res.json(comment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error retrieving comment" });
    }
  },

  async updateComment(req: AuthRequest, res: Response) {
    const commentId = req.params.id;
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      
      if (comment.author.toString() !== req.user?.sub) {
        return res.status(403).json({ message: "You can only update your own comments" });
      }

      const updatedComment = await Comment.findByIdAndUpdate(commentId, req.body, { 
        returnDocument: "after" 
      }).populate("author", "username profileUrl");

      return res.json(updatedComment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating comment" });
    }
  },

  async deleteComment(req: AuthRequest, res: Response) {
    const commentId = req.params.id;
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });

      if (comment.author.toString() !== req.user?.sub) {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }

      await Comment.findByIdAndDelete(commentId);
      return res.json({ message: "Comment deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting comment" });
    }
  },
};