import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { ragController } from "../controllers/ragController";

const router = Router();

router.post("/ask", authenticate, ragController.ask);

export default router;
