import express from "express";
import articleController from "../controllers/article.controller.js";

const router = express.Router();

// GET /api/articles (Retrieve articles with AI summaries and read count)
router.get("/api/articles", articleController.getArticles);

export default router;
