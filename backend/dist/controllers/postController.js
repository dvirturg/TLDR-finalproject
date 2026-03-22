"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const postModel_1 = __importDefault(require("../models/postModel"));
const removeUploadedFile = async (filePath) => {
    if (!filePath) {
        return;
    }
    await promises_1.default.unlink(path_1.default.resolve(filePath)).catch(() => undefined);
};
exports.postController = {
    async createPost(req, res) {
        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
        const author = typeof req.body.author === "string" ? req.body.author.trim() : "";
        const imageUrl = req.file ? `/public/uploads/posts/${req.file.filename}` : "";
        if (!text || !author) {
            await removeUploadedFile(req.file?.path);
            res.status(400).json({ message: "text and author are required" });
            return;
        }
        try {
            const newPost = await postModel_1.default.create({ text, author, imageUrl });
            res.status(201).json(newPost);
        }
        catch (err) {
            await removeUploadedFile(req.file?.path);
            console.error(err);
            res.status(500).json({ message: "Error creating post" });
        }
    },
    async getAllPosts(req, res) {
        try {
            if (Object.keys(req.query).length > 0) {
                const filterData = await postModel_1.default.find(req.query);
                return res.json(filterData);
            }
            const allPosts = await postModel_1.default.find();
            return res.json(allPosts);
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
            return res.json(post);
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
            const updatedPost = await postModel_1.default.findByIdAndUpdate(postId, updateData, { returnDocument: "after" });
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
            const likeIndex = post.likes.findIndex((like) => like.toString() === userId);
            if (likeIndex !== -1) {
                post.likes.splice(likeIndex, 1);
                await post.save();
                return res.json({ message: "Post unliked successfully" });
            }
            post.likes.push(userId);
            await post.save();
            return res.json({ message: "Post liked successfully" });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: "Error toggling post like" });
        }
    }
};
