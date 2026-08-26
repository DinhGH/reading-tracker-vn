// Import necessary modules
import express from "express";
import statsController from "../controllers/stats.controller.js";

const router = express.Router();

// Route to get statistics
router.get("/api/stats", statsController.getStats);

export default router;
