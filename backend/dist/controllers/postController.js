"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = void 0;
const postModel_1 = __importDefault(require("../models/postModel"));
exports.postController = {
    async createPost(req, res) {
        const postData = req.body;
        try {
            const newPost = await postModel_1.default.create(postData);
            res.status(201).json(newPost);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: "Error creating post" });
        }
    },
    async getAllPosts(req, res) {
        try {
            if (req.query) {
                const filterData = await postModel_1.default.find(req.query);
                return res.json(filterData);
            }
            else {
                const allPosts = await postModel_1.default.find();
                return res.json(allPosts);
            }
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error retrieving posts" });
        }
    },
    async getPostById(req, res) {
        const postId = req.params.id;
        try {
            const post = await postModel_1.default.findById(postId);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            else {
                return res.json(post);
            }
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error retrieving post" });
        }
    },
    async updatePostById(req, res) {
        const postId = req.params.id;
        const updateData = req.body;
        try {
            const updatedPost = await postModel_1.default.findByIdAndUpdate(postId, updateData, { new: true });
            if (!updatedPost) {
                return res.status(404).json({ message: "Post not found" });
            }
            return res.json(updatedPost);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating post" });
        }
    },
    async deletePostById(req, res) {
        const postId = req.params.id;
        try {
            const deletedPost = await postModel_1.default.findByIdAndDelete(postId);
            if (!deletedPost) {
                return res.status(404).json({ message: "Post not found" });
            }
            return res.json({ message: "Post deleted successfully" });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error deleting post" });
        }
    },
    async likePost(req, res) {
        const postId = req.params.id;
        const userId = req.body.userId;
        try {
            const post = await postModel_1.default.findById(postId);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }
            if (post.likes.includes(userId)) {
                return res.status(400).json({ message: "User already liked this post" });
            }
            post.likes.push(userId);
            await post.save();
            return res.json({ message: "Post liked successfully" });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error liking post" });
        }
    }
};
