// Service for fetching statistics data
import prisma from "../config/prisma.js";
import articleService from "./article.service.js";

/**
 * Weekly statistics: For each weekday, total reading time (minutes) and number of unique domains/topics.
 * Returns:
 * [
 *   { day: "Monday", readingTime: 120, topics: 5 },
 *   ...
 * ]
 */
export const getWeeklyReadingTopicStats = async () => {
  // Days in order (Sunday ~ Saturday js, but we want Monday first)
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  // Initialize result: map day name -> stats
  const dayStats = daysOfWeek.map((day) => ({
    day,
    readingTime: 0,
    topics: 0,
  }));

  // fetch all sessions with article info for current week
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  // set to Monday
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const sessions = await prisma.session.findMany({
    where: {
      start_time: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      article: true, // for domain/topic per session
    },
  });

  // Helper: Day name from date (Monday, ...)
  function getDayName(date) {
    // 0=Sunday, 1=Monday, ...
    const dayIdx = date.getDay();
    // shift so 0=Monday, 6=Sunday
    return daysOfWeek[(dayIdx + 6) % 7];
  }

  // Group by day: { day -> [sessions...] }
  const perDaySessions = {};
  for (const ses of sessions) {
    const dayName = getDayName(new Date(ses.start_time));
    if (!perDaySessions[dayName]) perDaySessions[dayName] = [];
    perDaySessions[dayName].push(ses);
  }

  // For each day, sum readingTime and unique topics/domains
  for (let i = 0; i < daysOfWeek.length; i++) {
    const day = daysOfWeek[i];
    const list = perDaySessions[day] || [];
    let readingTotal = 0;
    const topicSet = new Set();
    for (const ses of list) {
      // Calculate duration based on session status
      let duration = 0;

      if (ses.status === "COMPLETED" && ses.total_active_time > 0) {
        // For completed sessions, use recorded total_active_time
        duration = ses.total_active_time;
      } else if (ses.status === "ACTIVE") {
        // For active sessions, calculate real-time active duration
        // by parsing events and calculating from last PAGE_ACTIVE
        duration = await calculateActiveSessionDuration(ses.id);
      } else if (ses.end_time && ses.start_time) {
        // Fallback: use end_time - start_time
        duration = Math.floor(
          (new Date(ses.end_time) - new Date(ses.start_time)) / 1000,
        );
      }

      readingTotal += duration;
      if (ses.article && ses.article.domain) topicSet.add(ses.article.domain);
    }
    dayStats[i].readingTime = Math.round(readingTotal / 60); // to minutes
    dayStats[i].topics = topicSet.size;
  }
  return dayStats;
};

// Helper function: Calculate real-time active duration for active sessions
const calculateActiveSessionDuration = async (sessionId) => {
  try {
    const events = await prisma.event.findMany({
      where: { session_id: sessionId },
      orderBy: { timestamp: "asc" },
    });

    let totalActiveTime = 0;
    let activeStartTime = null;
    const now = Date.now();

    for (const event of events) {
      if (event.event_type === "PAGE_ACTIVE") {
        activeStartTime = new Date(event.timestamp).getTime();
      } else if (event.event_type === "PAGE_INACTIVE" && activeStartTime) {
        const inactiveTime = new Date(event.timestamp).getTime();
        totalActiveTime += Math.floor((inactiveTime - activeStartTime) / 1000);
        activeStartTime = null;
      }
    }

    // If session is still active, count from last PAGE_ACTIVE to now
    if (activeStartTime) {
      totalActiveTime += Math.floor((now - activeStartTime) / 1000);
    }

    return Math.max(totalActiveTime, 0);
  } catch (error) {
    console.error("Error calculating active session duration:", error);
    return 0;
  }
};

// Backward compatible function (deprecated, can delete later)
export const fetchStats = async () => {
  try {
    const activeSessionsCount = await prisma.session.count({
      where: { status: "ACTIVE" },
    });
    const totalUserCount = await prisma.user.count();
    return {
      activeSessions: activeSessionsCount,
      totalUsers: totalUserCount,
    };
  } catch (error) {
    console.error("Error in stats.service - fetchStats:", error);
    throw new Error("Failed to fetch statistics data");
  }
};

/**
 * Get comprehensive article and session statistics
 * Returns detailed metrics about articles, sessions, and user engagement
 */
export const getArticleSessionStats = async () => {
  try {
    const articles = await articleService.getArticles();

    // Aggregate statistics
    const totalArticles = articles.length;
    const totalSessions = articles.reduce(
      (sum, article) => sum + article.read_count,
      0,
    );
    const activeSessions = articles.reduce(
      (sum, article) => sum + article.active_sessions,
      0,
    );
    const completedSessions = articles.reduce(
      (sum, article) => sum + article.completed_sessions,
      0,
    );
    const totalReadTime = articles.reduce(
      (sum, article) => sum + article.total_read_time,
      0,
    );
    const avgReadTimePerArticle =
      totalArticles > 0 ? Math.round(totalReadTime / totalArticles) : 0; // in seconds

    const avgReadTimePerSession =
      totalSessions > 0 ? Math.round(totalReadTime / totalSessions) : 0; // in seconds

    // Event activity aggregates
    const eventActivityAggregate = {};
    articles.forEach((article) => {
      Object.entries(article.event_activity_counts || {}).forEach(
        ([eventType, count]) => {
          eventActivityAggregate[eventType] =
            (eventActivityAggregate[eventType] || 0) + count;
        },
      );
    });

    // Top articles by sessions
    const topArticles = articles
      .sort((a, b) => b.read_count - a.read_count)
      .slice(0, 10)
      .map((article) => ({
        id: article.id,
        title: article.title,
        domain: article.domain,
        read_count: article.read_count,
        total_read_time: Math.round(article.total_read_time / 60), // in minutes
        avg_session_time: article.avg_session_time,
      }));

    return {
      summary: {
        totalArticles,
        totalSessions,
        activeSessions,
        completedSessions,
        totalReadTime, // in seconds
        avgReadTimePerArticle, // in seconds
        avgReadTimePerSession, // in seconds
      },
      eventActivity: eventActivityAggregate,
      topArticles,
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        domain: article.domain,
        url: article.url,
        readCount: article.read_count,
        totalReadTime: article.total_read_time, // in seconds
        activeSessions: article.active_sessions,
        completedSessions: article.completed_sessions,
        avgSessionTime: article.avg_session_time,
        eventActivity: article.event_activity_counts,
      })),
    };
  } catch (error) {
    console.error("Error in getArticleSessionStats:", error);
    throw error;
  }
};

export default {
  getWeeklyReadingTopicStats,
  fetchStats,
  getArticleSessionStats,
};
