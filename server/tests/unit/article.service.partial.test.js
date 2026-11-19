import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const mockArticleFindMany = jest.fn();

await jest.unstable_mockModule("../../src/config/prisma.js", () => ({
  default: {
    article: {
      findMany: mockArticleFindMany,
    },
  },
}));

await jest.unstable_mockModule("../../src/services/ai.service.js", () => ({
  default: {
    summarizeAndClassify: jest.fn(),
  },
}));

const { default: articleService } = await import(
  "../../src/services/article.service.js"
);

describe("article.service (Pattern B: Partial Coverage - Completed Sessions Only)", () => {
  beforeEach(() => {
    mockArticleFindMany.mockReset();
  });

  it("computes read_count and total_read_time for articles with existing summaries", async () => {
    mockArticleFindMany.mockResolvedValue([
      {
        id: 1,
        url: "https://vnexpress.net/a1",
        domain: "vnexpress.net",
        title: "Existing AI Summary Article",
        content: "Body text",
        summary: "Existing summary",
        topic: "Technology",
        sessions: [
          {
            id: "s1",
            status: "COMPLETED",
            total_active_time: 100,
            events: [{ event_type: "PAGE_ENTER" }, { event_type: "PAGE_LEAVE" }],
          },
          {
            id: "s2",
            status: "COMPLETED",
            total_active_time: 200,
            events: [{ event_type: "PAGE_ENTER" }],
          },
        ],
      },
    ]);

    const articles = await articleService.getArticles();

    expect(articles).toHaveLength(1);
    expect(articles[0].read_count).toBe(2);
    expect(articles[0].total_read_time).toBe(300);
    expect(articles[0].avg_session_time).toBe(150);
    expect(articles[0].completed_sessions).toBe(2);
  });
});
