import prisma from "../config/prisma.js";

const getSessions = async (page, limit) => {
  const offset = (page - 1) * limit;

  const sessions = await prisma.session.findMany({
    skip: offset,
    take: limit,
    include: {
      article: true,
      events: true,
    },
  });

  const total = await prisma.session.count();

  // Post-process: calculate total_active_time if missing from events
  const processedSessions = sessions
    .map((session) => {
      const sessionWithUrl = {
        ...session,
        articleUrl: session.article?.url || null,
      };

      if (
        typeof sessionWithUrl.total_active_time === "number" &&
        sessionWithUrl.total_active_time > 0
      ) {
        return sessionWithUrl;
      }

      let totalActiveTime = 0;
      let activeStartTime = null;

      // Sort by timestamp ASC just in case
      const events = [...(sessionWithUrl.events || [])].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      );
      for (const event of events) {
        if (
          event.event_type === "PAGE_ACTIVE" ||
          event.event_type === "ACTIVE"
        ) {
          activeStartTime = new Date(event.timestamp).getTime();
        } else if (
          (event.event_type === "PAGE_INACTIVE" ||
            event.event_type === "INACTIVE") &&
          activeStartTime
        ) {
          const inactiveTime = new Date(event.timestamp).getTime();
          totalActiveTime += Math.floor(
            (inactiveTime - activeStartTime) / 1000,
          );
          activeStartTime = null;
        }
      }

      // Nếu chưa kết thúc session, tính đến event cuối cùng
      if (activeStartTime) {
        let lastTime = 0;
        if (events.length > 0) {
          lastTime = new Date(events[events.length - 1].timestamp).getTime();
        }
        totalActiveTime += Math.floor((lastTime - activeStartTime) / 1000);
      }

      return {
        ...sessionWithUrl,
        events, // Đảm bảo luôn trả ra events đã sort đúng timestamp tăng dần!
        total_active_time: Math.max(totalActiveTime, 0),
      };
    })
    .filter(
      (session) =>
        session.total_active_time > 0 ||
        (session.events && session.events.length > 0),
    );

  return {
    data: processedSessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  getSessions,
};
