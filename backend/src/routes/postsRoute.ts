import { Router } from "express";
import { postController } from "../controllers/postController";
import { uploadPostImage } from "../middleware/postImageUpload";
import { authenticate } from "../middleware/authenticate"; // הייבוא של ה"שומר"

const router = Router();

router.post("/", authenticate, uploadPostImage, postController.createPost);
router.put("/:id", authenticate, postController.updatePostById);
router.delete("/:id", authenticate, postController.deletePostById);
router.post("/:id/like", authenticate, postController.likePost);

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.get("/user/:userId", postController.getPostsByUserId);

export default router;