import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, getProfile);
profileRouter.put("/", requireAuth, updateProfile);
