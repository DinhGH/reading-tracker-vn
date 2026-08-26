import express from "express";
import AIController from "../controllers/ai.controller.js";

const router = express.Router();

// AI Summarization Endpoint
router.post("/summarize", AIController.summarize);

// AI Classification Endpoint
router.post("/classify", AIController.classify);

export default router;
