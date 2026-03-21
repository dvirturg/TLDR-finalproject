import  Post from "../models/postModel";
import { Request, Response } from "express";


export const postController = {
  async createPost(req: Request, res: Response) {
    const postData = req.body;
    try {
        const newPost = await Post.create(postData);
        res.status(201).json(newPost);
      }
    catch (err){
        console.error(err);
        res.status(500).json({ message: "Error creating post" });
        }
    }, 

    async getAllPosts(req: Request, res: Response) {
        try{
            if (req.query) {
                const filterData = await Post.find(req.query);
                return res.json(filterData);
            } else {
                const allPosts = await Post.find();
                return  res.json(allPosts);
            }
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
            } else {
                return res.json(post);
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error retrieving post" });
        }
    },

    async updatePostById(req: Request, res: Response) {
        const postId = req.params.id;
        const updateData = req.body;
        try {
            const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true });
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
            if (post.likes.includes(userId)) {
                return res.status(400).json({ message: "User already liked this post" });
            }
            post.likes.push(userId);
            await post.save();
            return res.json({ message: "Post liked successfully" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error liking post" });
        }
    }
};