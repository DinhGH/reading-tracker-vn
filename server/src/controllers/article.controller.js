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

// Tạo mới article
const addArticle = async (req, res) => {
  try {
    const article = await articleService.createArticle(req.body);
    await broadcastDashboardUpdate();
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Sửa article
const updateArticle = async (req, res) => {
  try {
    const article = await articleService.updateArticle(req.params.id, req.body);
    await broadcastDashboardUpdate();
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Xóa article
const deleteArticle = async (req, res) => {
  try {
    await articleService.deleteArticle(req.params.id);
    await broadcastDashboardUpdate();
    res.status(200).json({ success: true, message: "Article deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default {
  getArticles,
  addArticle,
  updateArticle,
  deleteArticle,
};
