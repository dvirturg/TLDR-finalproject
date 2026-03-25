import { Router } from "express";
import { commentController } from "../controllers/commentController";
import { authenticate } from "../middleware/authenticate"; // ייבוא השומר

const router = Router();

router.get("/post/:postId", commentController.getCommentsByPost);
router.get("/:id", commentController.getCommentById);
router.post("/", authenticate, commentController.createComment);
router.put("/:id", authenticate, commentController.updateComment);
router.delete("/:id", authenticate, commentController.deleteComment);

export default router;