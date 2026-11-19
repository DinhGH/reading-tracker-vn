import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

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

const { default: articleRoutes } = await import(
  "../../src/routes/article.routes.js"
);

const app = express();
app.use(express.json());
app.use(articleRoutes);

describe("GET /api/articles Redundant Endpoint Suite (Pattern C: Duplicate)", () => {
  beforeEach(() => {
    mockArticleFindMany.mockReset();
  });

  // Intentionally duplicates articles.integration.test.js without adding branch or line coverage
  it("fetches articles list with read_count and total_read_time", async () => {
    mockArticleFindMany.mockResolvedValue([
      {
        id: 1,
        url: "https://tuoitre.vn/news-1",
        domain: "tuoitre.vn",
        title: "Sample News",
        content: "Body",
        summary: "Existing summary",
        topic: "Education",
        sessions: [
          {
            id: "s-1",
            status: "COMPLETED",
            total_active_time: 140,
            events: [{ event_type: "PAGE_ENTER" }],
          },
        ],
      },
    ]);

    const res = await request(app).get("/api/articles");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].read_count).toBe(1);
    expect(res.body.data[0].total_read_time).toBe(140);
  });
});
