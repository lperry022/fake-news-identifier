import { Router } from "express";
import { analyze, getRecentChecks } from "../controllers/analyzeController.js";

export const analyzeRouter = Router();

analyzeRouter.post("/", analyze);
analyzeRouter.get("/recent", getRecentChecks);
