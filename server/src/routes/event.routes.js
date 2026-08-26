import express from "express";
import eventController from "../controllers/event.controller.js";

const router = express.Router();

// POST /api/events
router.post("/api/events", eventController.createEvent);

export default router;
