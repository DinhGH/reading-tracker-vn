import express from "express";
import sessionController from "../controllers/session.controller.js";

const router = express.Router();

// GET /api/sessions (Retrieve paginated sessions with related articles and events)
router.get("/api/sessions", sessionController.getSessions);

export default router;
