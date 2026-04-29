import { Response } from "express";
import { AuthRequest } from "../types/auth";
import ragService from "../services/ragService";

export const ragController = {
  async ask(req: AuthRequest, res: Response): Promise<void> {
    const question = typeof req.body.question === "string" ? req.body.question.trim() : "";
    const userId = req.user?.sub;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    if (!question) {
      res.status(400).json({ message: "question is required" });
      return;
    }

    try {
      const response = await ragService.answerQuestion(userId, question);
      res.json(response);
    } catch (error) {
      console.error("RAG ask error:", error);
      res.status(503).json({ message: "RAG service is unavailable" });
    }
  },
};
