// server/src/config/socket.js

import { Server } from "socket.io";

let io;

function initializeSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173", // Adjust this to the frontend's origin in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Unified dashboard update event
    socket.on("dashboard_update_request", (data) => {
      console.log("Dashboard update requested: ", data);

      // Ensure all required fields are present before broadcasting
      const { updatedArticles, updatedSessions, updatedStats } = data;

      // Log for debugging
      if (!updatedArticles || !updatedSessions || !updatedStats) {
        console.warn("Incomplete data received for dashboard update");
      }

      // Emit only properly structured updates
      io.emit("dashboard_update", {
        updatedArticles: updatedArticles || [],
        updatedSessions: updatedSessions || [],
        updatedStats: updatedStats || null,
      });
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getSocketInstance() {
  if (!io) {
    throw new Error(
      "Socket.io is not initialized. Call initializeSocketServer first.",
    );
  }
  return io;
}

export { initializeSocketServer, getSocketInstance };
