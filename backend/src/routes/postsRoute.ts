import { Router } from "express";
import { postController } from "../controllers/postController";
import { uploadPostImage } from "../middleware/postImageUpload";

const router = Router();

router.post("/", uploadPostImage, postController.createPost);
router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.put("/:id", postController.updatePostById);
router.delete("/:id", postController.deletePostById);
router.post("/:id/like", postController.likePost);
router.get("/user/:userId", postController.getPostsByUserId);

export default router;
