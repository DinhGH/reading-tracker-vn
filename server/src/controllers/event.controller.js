import eventService from "../services/event.service.js";
import { z } from "zod";
import { broadcastDashboardUpdate } from "../utils/dashboard.util.js";

const eventSchema = z.object({
  event_type: z.enum([
    "PAGE_ENTER",
    "PAGE_ACTIVE",
    "PAGE_INACTIVE",
    "PAGE_LEAVE",
  ]),
  url: z.string(),
  title: z.string(),
  domain: z.string().optional(),
  content: z.string().optional(),
  timestamp: z.string(),
  session_id: z.string(),
  metadata: z.any().optional(),
});

const createEvent = async (req, res) => {
  try {
    // Validate incoming request body
    const payload = eventSchema.parse(req.body);

    // Delegate to event service
    const result = await eventService.createEvent(payload);

    // Broadcast update
    broadcastDashboardUpdate();

    // Respond to client
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    // Handle validation and other errors
    if (error.name === "ZodError") {
      return res.status(400).json({ success: false, message: error.errors });
    }
    console.error("[Event Controller] Error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default {
  createEvent,
};
