import { Router } from "express";
import requireAuth from "../middleware/auth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const router = Router();
router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, updateProfile);

export default router;
