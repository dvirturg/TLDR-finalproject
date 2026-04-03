import { Response } from "express";
import ChatMessage from "../models/chatModel";
import { AuthRequest } from "../types/auth"; 
import { Types } from "mongoose";

// Controller for handling chat-related operations
export const chatController = {
    // Get list of conversations for the authenticated user
    async getConversations(req: AuthRequest, res: Response): Promise<void> {
        try {
            const authUserId = req.user!.sub;

            const conversations = await ChatMessage.aggregate([
            {
                $match: {
                        $or: [{ senderId: authUserId }, { receiverId: authUserId }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    otherUserId: {
                        $cond: [{ $eq: ["$senderId", authUserId] }, "$receiverId", "$senderId" ] 
                    },
                },
            },
            {
                $group: {
                    _id: "$otherUserId",
                    lastMessage: { $first: "$message" },
                    lastMessageAt: { $first: "$createdAt" },
                    unread: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$receiverId", authUserId] }, { $eq: ["$read", false] }] }, 1, 0
                            ],
                        },
                    },

                }
            },
                { 
                    $sort: { lastMessageAt: -1 },
                },
               
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "otherUser",
                    },
                },
                {
                    $unwind: "$otherUser",
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$otherUser._id",
                        username: "$otherUser.username",
                        profileUrl: "$otherUser.profileUrl",
                        lastMessage: 1,
                        lastMessageAt: 1,
                        unread: 1,
                    },
                }
            ]);

            res.json(conversations);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch conversations", error });
        }
    },

    // Get chat history between authenticated user and another user
    async getChatHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const authUserId = req.user!.sub;
            const { userId: targetUserId } = req.params as { userId: string };

            if (!Types.ObjectId.isValid(targetUserId)) {
                res.status(400).json({ message: "Invalid user ID" });
                return;
            }

            if (authUserId === targetUserId) {
                res.status(400).json({ message: "Cannot fetch chat history with yourself" });
                return;
            }

            const messages = await ChatMessage.find({
                $or: [
                    { senderId: authUserId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: authUserId },
                ],
            }).sort({ createdAt: 1 })
            .populate("senderId", "username profileUrl")
            .populate("receiverId", "username profileUrl");
        res.json(messages);
    }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch chat history", error });
        }
    },

    // Mark a message as read
    async markAsRead(req: AuthRequest, res: Response) {
        try {
            const authUserId = req.user!.sub;
            const {userId: senderId} = req.params as { userId: string };
            const { messageId } = req.params;

            if (!Types.ObjectId.isValid(senderId)) {
                res.status(400).json({ message: "Invalid sender ID or message ID" });
                return;
            }

            if (authUserId === senderId) {
                res.status(400).json({ message: "Cannot mark your own message as read" });
                return;
            }

            await ChatMessage.findOneAndUpdate(
                { _id: messageId, senderId, receiverId: authUserId },
                { read: true }
            );
            res.json({ message: "Message marked as read" });
        } catch (error) {
            res.status(500).json({ message: "Failed to mark message as read", error });
        }
    }
};
