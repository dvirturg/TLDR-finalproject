import { Response } from "express";
import { Types } from "mongoose";
import ChatMessage from "../models/chatModel";
import { AuthRequest } from "../types/auth";

export const chatController = {
  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user!.sub;
      if (!Types.ObjectId.isValid(authUserId)) {
        res.status(400).json({ message: "Invalid authenticated user id" });
        return;
      }

      const authOid = new Types.ObjectId(authUserId);

      const conversations = await ChatMessage.aggregate([
        {
          $match: {
            $or: [{ sender: authOid }, { recipient: authOid }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $addFields: {
            otherUserId: {
              $cond: [{ $eq: ["$sender", authOid] }, "$recipient", "$sender"],
            },
          },
        },
        {
          $group: {
            _id: "$otherUserId",
            lastMessage: { $first: "$content" },
            lastMessageAt: { $first: "$createdAt" },
            unread: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$recipient", authOid] },
                      { $eq: ["$read", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { lastMessageAt: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "otherUser",
          },
        },
        { $unwind: "$otherUser" },
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
        },
      ]);

      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations", error });
    }
  },

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
          { sender: authUserId, recipient: targetUserId },
          { sender: targetUserId, recipient: authUserId },
        ],
      })
        .sort({ createdAt: 1 })
        .populate("sender", "username profileUrl")
        .populate("recipient", "username profileUrl");

      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history", error });
    }
  },

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authUserId = req.user!.sub;
      const { messageId } = req.params as { messageId: string };

      if (!Types.ObjectId.isValid(messageId)) {
        res.status(400).json({ message: "Invalid message ID" });
        return;
      }

      await ChatMessage.findOneAndUpdate(
        { _id: messageId, recipient: authUserId },
        { read: true },
      );

      res.json({ message: "Message marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read", error });
    }
  },
};
