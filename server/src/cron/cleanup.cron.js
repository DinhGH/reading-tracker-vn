// Cron job for cleaning up hanging sessions
import cron from "node-cron";
import prisma from "../config/prisma.js";

const cleanupHangingSessions = async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    await prisma.session.updateMany({
      where: {
        status: "ACTIVE",
        updated_at: { lt: fiveMinutesAgo },
      },
      data: { status: "COMPLETED" },
    });

    console.log("Hanging sessions cleaned up successfully");
  } catch (error) {
    console.error("Error cleaning up hanging sessions:", error);
  }
};

// Schedule the cron job
cron.schedule("*/1 * * * *", cleanupHangingSessions); // Runs every minute

export default cleanupHangingSessions;
