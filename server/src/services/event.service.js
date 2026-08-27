import prisma from "../config/prisma.js";
import { randomUUID } from "crypto";
import aiService from "./ai.service.js";
import { broadcastDashboardUpdate } from "../utils/dashboard.util.js";

const createEvent = async (payload) => {
  const {
    session_id,
    event_type,
    url,
    title,
    domain,
    content,
    timestamp,
    metadata,
  } = payload;

  // Generate unique event ID for idempotency
  const eventId = randomUUID();

  // Check for duplicate event by session_id and event_type combination
  // (simple deduplication based on recent events)
  // NOTE: PAGE_ENTER is exempted from deduplication
  // PAGE_ENTER marks new sessions
  // Allow state transitions: PAGE_ACTIVE -> PAGE_INACTIVE -> PAGE_ACTIVE
  if (event_type !== "PAGE_ENTER") {
    // Only deduplicate if the previous event is of the SAME type
    // This prevents false deduplication of legitimate state transitions
    const recentEvent = await prisma.event.findFirst({
      where: {
        session_id,
        event_type,
        timestamp: {
          gte: new Date(new Date().getTime() - 5000), // Within last 5 seconds
        },
      },
      orderBy: { timestamp: "desc" },
    });

    if (recentEvent) {
      return { message: "Duplicate event ignored", event: recentEvent };
    }
  }

  // Extract domain from URL if not provided
  const domainName = domain || new URL(url).hostname;

  // Ensure the article exists before event creation
  // Use transaction to handle race condition on concurrent upserts
  let article;
  try {
    article = await prisma.article.upsert({
      where: { url },
      update: {
        content: content || undefined,
      },
      create: {
        url,
        title,
        domain: domainName,
        content: content || "",
      },
    });
  } catch (upsertError) {
    // Handle race condition: if unique constraint fails, fetch the existing article
    if (upsertError.code === "P2002") {
      article = await prisma.article.findUnique({
        where: { url },
      });
      if (!article) {
        throw upsertError; // Re-throw if still not found
      }
    } else {
      throw upsertError;
    }
  }

  // Ensure the session exists or create if not
  let session = await prisma.session.findUnique({
    where: { id: session_id },
  });

  // BLOCK: Prevent duplicate session creation with same article (status != COMPLETED)
  if (!session) {
    // Try to find an existing session by article_id (and optionally user) not COMPLETED
    const existingSession = await prisma.session.findFirst({
      where: {
        article_id: article.id,
        status: { not: "COMPLETED" },
      },
      orderBy: { start_time: "desc" },
    });

    // Check if session was completed in the last 10 minutes to ignore ghost events
    const recentCompletedSession = await prisma.session.findFirst({
      where: {
        article_id: article.id,
        status: "COMPLETED",
        end_time: { gte: new Date(new Date().getTime() - 10 * 60 * 1000) },
      },
      orderBy: { end_time: "desc" },
    });

    if (recentCompletedSession && event_type === "PAGE_ENTER") {
      return { message: "Ghost session ignored", event: null };
    }

    if (existingSession) {
      session = existingSession;
      // Optionally: Could also merge events here if needed
    } else {
      // Only create session if event_type is PAGE_ACTIVE or PAGE_INACTIVE or PAGE_LEAVE
      if (
        event_type === "PAGE_ACTIVE" ||
        event_type === "PAGE_INACTIVE" ||
        event_type === "PAGE_LEAVE"
      ) {
        try {
          session = await prisma.session.upsert({
            where: { id: session_id },
            create: {
              id: session_id,
              article_id: article.id,
              start_time: new Date(timestamp),
            },
            update: {
              updated_at: new Date(),
            },
          });
        } catch (upsertError) {
          if (upsertError.code === "P2002") {
            session = await prisma.session.findUnique({
              where: { id: session_id },
            });
            if (!session) {
              throw upsertError; // Re-throw if still not found
            }
          } else {
            throw upsertError;
          }
        }
      } else {
        // For PAGE_ENTER without session: create a placeholder session first
        // This prevents foreign key constraint errors
        try {
          session = await prisma.session.create({
            data: {
              id: session_id,
              article_id: article.id,
              start_time: new Date(timestamp),
            },
          });
        } catch (createError) {
          if (createError.code === "P2002") {
            // Race condition: session was created between check and create
            session = await prisma.session.findUnique({
              where: { id: session_id },
            });
            if (!session) {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    }
  } else {
    // Update session based on event type
    // Note:
    // - PAGE_INACTIVE is for ending the current active period; total_active_time is updated accordingly.
    // - PAGE_LEAVE is for finalizing the session when the user leaves for good.
    if (event_type === "PAGE_LEAVE") {
      // Compute total active time by summing PAGE_ACTIVE to PAGE_INACTIVE intervals
      const allEvents = await prisma.event.findMany({
        where: { session_id },
        orderBy: { timestamp: "asc" },
      });

      let totalActiveTime = 0;
      let activeStartTime = null;

      for (const event of allEvents) {
        if (event.event_type === "PAGE_ACTIVE") {
          activeStartTime = new Date(event.timestamp).getTime();
        } else if (event.event_type === "PAGE_INACTIVE" && activeStartTime) {
          const inactiveTime = new Date(event.timestamp).getTime();
          totalActiveTime += Math.floor(
            (inactiveTime - activeStartTime) / 1000,
          );
          activeStartTime = null;
        }
      }

      // If page is still active at the time of PAGE_LEAVE, count from last PAGE_ACTIVE to PAGE_LEAVE
      if (activeStartTime) {
        const endTime = new Date(timestamp).getTime();
        totalActiveTime += Math.floor((endTime - activeStartTime) / 1000);
      }

      // If total_active_time is 0, delete the session instead of saving it
      if (totalActiveTime === 0) {
        // Delete the session and all its events
        await prisma.event.deleteMany({
          where: { session_id },
        });
        await prisma.session.delete({
          where: { id: session_id },
        });
      } else {
        session = await prisma.session.update({
          where: { id: session_id },
          data: {
            end_time: new Date(timestamp),
            status: "COMPLETED",
            updated_at: new Date(),
            total_active_time: Math.max(totalActiveTime, 0),
          },
        });
      }
    } else {
      session = await prisma.session.update({
        where: { id: session_id },
        data: {
          updated_at: new Date(),
        },
      });
    }
  }

  // Trigger AI generation if summary/topic missing and content present
  if (
    (!article.summary || !article.topic) &&
    article.content &&
    article.content.length > 100
  ) {
    aiService
      .summarizeAndClassify(article.content)
      .then(async (aiResult) => {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            summary: aiResult.summary,
            topic: aiResult.topics.join(", "),
          },
        });
        // Trigger dashboard update after AI generation
        broadcastDashboardUpdate();
      })
      .catch((e) =>
        console.error(
          `Failed to auto-generate AI data for article ${article.id}:`,
          e.message,
        ),
      );
  }

  // Create a new event
  const event = await prisma.event.create({
    data: {
      id: eventId,
      session_id,
      event_type,
      timestamp: new Date(timestamp),
      metadata,
    },
  });

  return event;
};

export default {
  createEvent,
};
