import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { authenticate } from "../middleware/authenticate"; // ייבוא השומר

const router = Router();

router.get("/conversations",authenticate, chatController.getConversations);
router.get("/:userId", authenticate, chatController.getChatHistory);
router.post("/message/:messageId/read", authenticate, chatController.markAsRead);
export default router;