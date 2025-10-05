// backend/routes/analyzeRoutes.js
import { Router } from "express";
import { analyze, getRecentChecks } from "../controllers/analyzeController.js";
import { validate, analyzeSchema } from "../middleware/validate.js";

export const analyzeRouter = Router();


analyzeRouter.post("/", validate(analyzeSchema), analyze);
analyzeRouter.get("/recent", getRecentChecks);