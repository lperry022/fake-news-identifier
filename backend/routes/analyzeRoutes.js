// backend/routes/analyzeRoutes.js
import { Router } from "express";
import { analyze } from "../controllers/analyzeController.js";
import { validate, analyzeSchema } from "../middleware/validate.js";

export const analyzeRouter = Router();
analyzeRouter.post("/", validate(analyzeSchema), analyze);
