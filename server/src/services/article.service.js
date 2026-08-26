import prisma from "../config/prisma.js";
import aiService from "./ai.service.js";

const getArticles = async () => {
  const articles = await prisma.article.findMany({
    include: {
      sessions: {
        include: {
          events: true, // Include event data to analyze engagement and activity
        },
      },
    },
  });
  // Removed redundant/misplaced block of code

  // Helper để tính lại total_active_time từ events nếu chưa có/là 0:
  // Cũng tính realtime cho active sessions
  async function calculateActiveTimeForSession(
    sessionId,
    endTime = null,
    isActive = false,
  ) {
    const events = await prisma.event.findMany({
      where: { session_id: sessionId },
      orderBy: { timestamp: "asc" },
    });
    let totalActiveTime = 0;
    let activeStartTime = null;

    for (const event of events) {
      if (event.event_type === "PAGE_ACTIVE") {
        activeStartTime = new Date(event.timestamp).getTime();
      } else if (
        (event.event_type === "PAGE_INACTIVE" ||
          event.event_type === "PAGE_LEAVE") &&
        activeStartTime
      ) {
        const inactiveTime = new Date(event.timestamp).getTime();
        totalActiveTime += Math.floor((inactiveTime - activeStartTime) / 1000);
        activeStartTime = null;
      }
    }
    // Nếu đang active chưa off, tính tới endTime (nếu có) hoặc hiện tại
    if (activeStartTime) {
      let end = Date.now();
      if (endTime) {
        end = new Date(endTime).getTime();
      }
      totalActiveTime += Math.floor((end - activeStartTime) / 1000);
    }
    return Math.max(totalActiveTime, 0);
  }

  // Xử lý song song (Promise.all cho performance)
  return Promise.all(
    articles.map(async (article) => {
      // Ensure AI data is present
      if (
        (!article.summary || !article.topic) &&
        article.content &&
        article.content.length > 100
      ) {
        try {
          const aiResult = await aiService.summarizeAndClassify(
            article.content,
          );
          article = await prisma.article.update({
            where: { id: article.id },
            data: {
              summary: aiResult.summary,
              topic: aiResult.topics.join(", "),
            },
          });
        } catch (e) {
          console.error(
            `Failed to auto-generate AI data for article ${article.id}:`,
            e.message,
          );
        }
      }

      const sessions = article.sessions || [];
      const readCount = sessions.length;

      // Calculate session statistics
      const activeSessions = sessions.filter(
        (session) => session.status === "ACTIVE",
      ).length;
      const completedSessions = sessions.filter(
        (session) => session.status === "COMPLETED",
      ).length;

      // Calculate dynamic active time for all sessions
      const sessionDurations = await Promise.all(
        sessions.map(async (session) => {
          if (session.status === "ACTIVE") {
            return await calculateActiveTimeForSession(session.id, null, true);
          }
          return session.total_active_time || 0;
        }),
      );

      const totalReadTime = sessionDurations.reduce(
        (sum, duration) => sum + duration,
        0,
      );
      const avgSessionTime = totalReadTime / Math.max(sessions.length, 1);

      // Event activity count
      const eventActivityCounts = sessions.reduce((counts, session) => {
        (session.events || []).forEach((event) => {
          counts[event.event_type] = (counts[event.event_type] || 0) + 1;
        });
        return counts;
      }, {});

      return {
        ...article,
        read_count: readCount,
        total_read_time: totalReadTime,
        active_sessions: activeSessions,
        completed_sessions: completedSessions,
        avg_session_time: Math.round(avgSessionTime),
        event_activity_counts: eventActivityCounts,
      };
    }),
  );
};

export default {
  getArticles,
};
