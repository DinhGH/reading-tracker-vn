// server/src/utils/dashboard.util.js
import { getSocketInstance } from "../config/socket.js";
import articleService from "../services/article.service.js";
import sessionService from "../services/session.service.js";
import statsService from "../services/stats.service.js";

export const broadcastDashboardUpdate = async () => {
  try {
    const io = getSocketInstance();
    // Lấy toàn bộ dữ liệu mới nhất
    const [articles, sessionsData, statsData] = await Promise.all([
      articleService.getArticles(),
      sessionService.getSessions(1, 100),
      statsService.getArticleSessionStats(),
    ]);

    io.emit("dashboard_update", {
      updatedArticles: articles,
      updatedSessions: sessionsData.data,
      updatedStats: statsData,
    });
  } catch (error) {
    console.error("Broadcast dashboard update failed:", error);
  }
};
