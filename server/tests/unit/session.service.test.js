import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockFindMany = jest.fn();
const mockCount = jest.fn();

await jest.unstable_mockModule("../../src/config/prisma.js", () => ({
  default: {
    session: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const { default: sessionService } = await import(
  "../../src/services/session.service.js"
);

describe("session.service (Pattern A: Gold Standard)", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockCount.mockReset();
  });

  it("computes pagination metadata and preserves existing total_active_time", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "sess-1",
        article_id: 1,
        total_active_time: 120,
        article: { url: "https://vnexpress.net/a1", title: "Article 1" },
        events: [
          {
            id: "e-1",
            event_type: "PAGE_ENTER",
            timestamp: "2026-08-18T10:00:00.000Z",
          },
        ],
      },
    ]);
    mockCount.mockResolvedValue(25);

    const result = await sessionService.getSessions(2, 10);

    expect(mockFindMany).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      include: { article: true, events: true },
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(result.data[0].total_active_time).toBe(120);
    expect(result.data[0].articleUrl).toBe("https://vnexpress.net/a1");
  });

  it("recalculates total_active_time from unsorted PAGE_ACTIVE/PAGE_INACTIVE events", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "sess-2",
        article_id: 2,
        total_active_time: 0,
        article: { url: "https://dantri.com.vn/news" },
        events: [
          {
            id: "e-2",
            event_type: "PAGE_INACTIVE",
            timestamp: "2026-08-18T10:01:30.000Z",
          },
          {
            id: "e-1",
            event_type: "PAGE_ACTIVE",
            timestamp: "2026-08-18T10:00:00.000Z",
          },
        ],
      },
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sessionService.getSessions(1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].total_active_time).toBe(90);
    expect(result.data[0].events.map((e) => e.id)).toEqual(["e-1", "e-2"]);
  });

  it("handles legacy ACTIVE events still open until last event timestamp", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "sess-3",
        article_id: 3,
        total_active_time: null,
        article: null,
        events: [
          {
            id: "e-1",
            event_type: "ACTIVE",
            timestamp: "2026-08-18T11:00:00.000Z",
          },
          {
            id: "e-2",
            event_type: "PAGE_LEAVE",
            timestamp: "2026-08-18T11:00:45.000Z",
          },
        ],
      },
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sessionService.getSessions(1, 10);

    expect(result.data[0].total_active_time).toBe(45);
    expect(result.data[0].articleUrl).toBeNull();
  });

  it("filters out sessions with zero active time and no events", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "sess-empty",
        article_id: 4,
        total_active_time: 0,
        article: { url: "https://tuoitre.vn/x" },
        events: [],
      },
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sessionService.getSessions(1, 10);

    expect(result.data).toEqual([]);
  });
});
