// backend/routes/analyzeRoutes.js
import { Router } from "express";
import { analyze } from "../controllers/analyzeController.js";
import { validate, analyzeSchema } from "../middleware/validate.js";

export const analyzeRouter = Router();

// POST /api/analyze
// Body: { input: "headline or url" }
// Returns: { verdict, score, sourceLabel, flags, domain, highlightedText }
analyzeRouter.post("/", validate(analyzeSchema), analyze);
