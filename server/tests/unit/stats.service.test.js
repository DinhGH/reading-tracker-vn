import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockSessionFindMany = jest.fn();
const mockSessionCount = jest.fn();
const mockEventFindMany = jest.fn();
const mockUserCount = jest.fn();
const mockGetArticles = jest.fn();

await jest.unstable_mockModule("../../src/config/prisma.js", () => ({
  default: {
    session: {
      findMany: mockSessionFindMany,
      count: mockSessionCount,
    },
    event: {
      findMany: mockEventFindMany,
    },
    user: {
      count: mockUserCount,
    },
  },
}));

await jest.unstable_mockModule("../../src/services/article.service.js", () => ({
  default: {
    getArticles: mockGetArticles,
  },
}));

const { default: statsService } = await import(
  "../../src/services/stats.service.js"
);

describe("stats.service (Pattern E: High Unit / 0% Integration + Pattern D Fail)", () => {
  beforeEach(() => {
    mockSessionFindMany.mockReset();
    mockSessionCount.mockReset();
    mockEventFindMany.mockReset();
    mockUserCount.mockReset();
    mockGetArticles.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("aggregates weekly reading time and unique domains across COMPLETED, ACTIVE, and fallback sessions", async () => {
    const mondayMorning = new Date();
    mondayMorning.setHours(9, 0, 0, 0);
    const tuesdayMorning = new Date(mondayMorning);
    tuesdayMorning.setDate(mondayMorning.getDate() + 1);

    mockSessionFindMany.mockResolvedValue([
      {
        id: "s-completed",
        status: "COMPLETED",
        total_active_time: 180,
        start_time: mondayMorning.toISOString(),
        article: { domain: "vnexpress.net" },
      },
      {
        id: "s-active",
        status: "ACTIVE",
        total_active_time: 0,
        start_time: mondayMorning.toISOString(),
        article: { domain: "dantri.com.vn" },
      },
      {
        id: "s-fallback",
        status: "COMPLETED",
        total_active_time: 0,
        start_time: tuesdayMorning.toISOString(),
        end_time: new Date(tuesdayMorning.getTime() + 120 * 1000).toISOString(),
        article: { domain: "tuoitre.vn" },
      },
    ]);

    mockEventFindMany.mockResolvedValue([
      {
        event_type: "PAGE_ACTIVE",
        timestamp: new Date(mondayMorning.getTime()).toISOString(),
      },
      {
        event_type: "PAGE_INACTIVE",
        timestamp: new Date(mondayMorning.getTime() + 120 * 1000).toISOString(),
      },
    ]);

    const weekly = await statsService.getWeeklyReadingTopicStats();

    expect(weekly).toHaveLength(7);
    expect(weekly[0].day).toBe("Monday");
    const totalReadingMinutes = weekly.reduce((sum, d) => sum + d.readingTime, 0);
    const totalUniqueDomains = weekly.reduce((sum, d) => sum + d.topics, 0);
    expect(totalReadingMinutes).toBe(7); // (180 + 120 + 120)s = 420s = 7 min
    expect(totalUniqueDomains).toBe(3);
  });

  it("computes comprehensive article and session statistics including topArticles", async () => {
    mockGetArticles.mockResolvedValue([
      {
        id: 1,
        title: "Article One",
        domain: "vnexpress.net",
        url: "https://vnexpress.net/1",
        read_count: 3,
        total_read_time: 300,
        active_sessions: 1,
        completed_sessions: 2,
        avg_session_time: 100,
        event_activity_counts: { PAGE_ENTER: 3, PAGE_ACTIVE: 3 },
      },
      {
        id: 2,
        title: "Article Two",
        domain: "dantri.com.vn",
        url: "https://dantri.com.vn/2",
        read_count: 5,
        total_read_time: 600,
        active_sessions: 0,
        completed_sessions: 5,
        avg_session_time: 120,
        event_activity_counts: { PAGE_ENTER: 5, PAGE_LEAVE: 5 },
      },
    ]);

    const stats = await statsService.getArticleSessionStats();

    expect(stats.summary).toEqual({
      totalArticles: 2,
      totalSessions: 8,
      activeSessions: 1,
      completedSessions: 7,
      totalReadTime: 900,
      avgReadTimePerArticle: 450,
      avgReadTimePerSession: 113,
    });
    expect(stats.eventActivity).toEqual({
      PAGE_ENTER: 8,
      PAGE_ACTIVE: 3,
      PAGE_LEAVE: 5,
    });
    expect(stats.topArticles[0].id).toBe(2);
    expect(stats.topArticles[0].total_read_time).toBe(10);
  });

  it("handles fetchStats success and error fallback", async () => {
    mockSessionCount.mockResolvedValue(4);
    mockUserCount.mockResolvedValue(12);

    const ok = await statsService.fetchStats();
    expect(ok).toEqual({ activeSessions: 4, totalUsers: 12 });

    mockUserCount.mockRejectedValue(new Error("Unknown model user"));
    await expect(statsService.fetchStats()).rejects.toThrow(
      "Failed to fetch statistics data",
    );
  });

  // Pattern D - Intentional Unit Failure #2 (Boundary / Null Mismatch):
  // stats.service.js returns 0 for avgReadTimePerArticle when articles is empty,
  // whereas this test asserts null for an undefined average.
  it("returns null avgReadTimePerArticle when no articles exist", async () => {
    mockGetArticles.mockResolvedValue([]);

    const stats = await statsService.getArticleSessionStats();
    expect(stats.summary.avgReadTimePerArticle).toBeNull();
  });
});
