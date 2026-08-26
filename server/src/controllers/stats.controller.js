// Import necessary modules
import statsService from "../services/stats.service.js";

// Controller for fetching statistics data
const getStats = async (req, res) => {
  try {
    // Fetch weekly reading & topic statistics and comprehensive article/session stats
    const weeklyStats = await statsService.getWeeklyReadingTopicStats();
    const articleSessionStats = await statsService.getArticleSessionStats();

    res.status(200).json({
      success: true,
      data: {
        weeklyStats,
        articleSessionStats,
        topArticles: articleSessionStats.topArticles,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export default {
  getStats,
};
