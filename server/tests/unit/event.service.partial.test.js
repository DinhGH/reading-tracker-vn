import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockEventFindFirst = jest.fn();
const mockEventCreate = jest.fn();
const mockArticleUpsert = jest.fn();
const mockSessionFindUnique = jest.fn();
const mockSessionFindFirst = jest.fn();
const mockSessionCreate = jest.fn();

await jest.unstable_mockModule("../../src/config/prisma.js", () => ({
  default: {
    event: {
      findFirst: mockEventFindFirst,
      create: mockEventCreate,
    },
    article: {
      upsert: mockArticleUpsert,
    },
    session: {
      findUnique: mockSessionFindUnique,
      findFirst: mockSessionFindFirst,
      create: mockSessionCreate,
    },
  },
}));

await jest.unstable_mockModule("../../src/services/ai.service.js", () => ({
  default: {
    summarizeAndClassify: jest.fn(),
  },
}));

await jest.unstable_mockModule("../../src/utils/dashboard.util.js", () => ({
  broadcastDashboardUpdate: jest.fn(),
}));

const { default: eventService } = await import(
  "../../src/services/event.service.js"
);

describe("event.service (Pattern B: Partial Coverage - Main Happy Branch Only)", () => {
  beforeEach(() => {
    mockEventFindFirst.mockReset();
    mockEventCreate.mockReset();
    mockArticleUpsert.mockReset();
    mockSessionFindUnique.mockReset();
    mockSessionFindFirst.mockReset();
    mockSessionCreate.mockReset();
  });

  it("creates article, session, and event for a fresh PAGE_ENTER event", async () => {
    mockArticleUpsert.mockResolvedValue({
      id: 10,
      url: "https://vnexpress.net/tech-news",
      domain: "vnexpress.net",
      title: "Tech News",
      content: "Short content",
      summary: "Already summarized",
      topic: "Tech",
    });
    mockSessionFindUnique.mockResolvedValue(null);
    mockSessionFindFirst.mockResolvedValue(null);
    mockSessionCreate.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      article_id: 10,
    });
    mockEventCreate.mockResolvedValue({
      id: "evt-100",
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      event_type: "PAGE_ENTER",
    });

    const result = await eventService.createEvent({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      event_type: "PAGE_ENTER",
      url: "https://vnexpress.net/tech-news",
      title: "Tech News",
      content: "Short content",
      timestamp: "2026-08-18T12:00:00.000Z",
    });

    expect(mockArticleUpsert).toHaveBeenCalledTimes(1);
    expect(mockSessionCreate).toHaveBeenCalledTimes(1);
    expect(mockEventCreate).toHaveBeenCalledTimes(1);
    expect(result.event_type).toBe("PAGE_ENTER");
  });
});
