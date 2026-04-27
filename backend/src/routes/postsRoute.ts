import { Router } from "express";
import { postController } from "../controllers/postController";
import { uploadPostImage } from "../middleware/postImageUpload";
import { authenticate } from "../middleware/authenticate"; 

const router = Router();

router.post("/", authenticate, uploadPostImage, postController.createPost);
router.put("/:id", authenticate, uploadPostImage, postController.updatePostById);
router.delete("/:id", authenticate, postController.deletePostById);
router.post("/:id/like", authenticate, postController.likePost);

router.get("/", authenticate, postController.getAllPosts);
router.get("/search", authenticate, postController.searchPosts);
router.get("/recommendations", authenticate, postController.getRecommendedPosts);
router.get("/user/:userId", authenticate, postController.getPostsByUserId);
router.get("/:id", authenticate, postController.getPostById);

export default router;
