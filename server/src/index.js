import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import eventRoutes from "./routes/event.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import articleRoutes from "./routes/article.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import errorHandler from "./middlewares/error.middleware.js";
import prisma from "./config/prisma.js";
import cleanupHangingSessions from "./cron/cleanup.cron.js";

// Import WebSocket initialization
import { initializeSocketServer } from "./config/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initializeSocketServer(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use(eventRoutes);
app.use(sessionRoutes);
app.use(articleRoutes);
app.use(statsRoutes);
app.use(aiRoutes);

// Health Check
app.get("/", (req, res) => {
  res.status(200).send("Server is running...");
});

// Error Middleware (must be last)
app.use(errorHandler);

// Start cleanup cron job
cleanupHangingSessions();

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`Server is listening on free port http://localhost:${PORT}`);
    console.log("Database connection has been established successfully.");
  } catch (err) {
    console.log("DB default port-failure elegantly captured");
  }
});

export { io };
