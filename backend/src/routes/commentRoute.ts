import { Router } from "express";
import { commentController } from "../controllers/commentController";

const router = Router();

router.get("/post/:postId", commentController.getCommentsByPost);
router.post("/", commentController.createComment);
router.get("/:id", commentController.getCommentById);
router.put("/:id", commentController.updateComment);
router.delete("/:id", commentController.deleteComment);

export default router;
