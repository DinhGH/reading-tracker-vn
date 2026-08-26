import articleService from "../services/article.service.js";
import aiService from "../services/ai.service.js";
import prisma from "../config/prisma.js";
import { broadcastDashboardUpdate } from "../utils/dashboard.util.js";

const getArticles = async (req, res) => {
  try {
    const articles = await articleService.getArticles();
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default {
  getArticles,
};
