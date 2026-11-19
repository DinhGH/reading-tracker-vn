import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const mockSessionFindMany = jest.fn();
const mockSessionCount = jest.fn();

await jest.unstable_mockModule("../../src/config/prisma.js", () => ({
  default: {
    session: {
      findMany: mockSessionFindMany,
      count: mockSessionCount,
    },
  },
}));

const { default: sessionRoutes } = await import(
  "../../src/routes/session.routes.js"
);

const app = express();
app.use(express.json());
app.use(sessionRoutes);

describe("GET /api/sessions Integration (Pattern A + Pattern D Contract Fail)", () => {
  beforeEach(() => {
    mockSessionFindMany.mockReset();
    mockSessionCount.mockReset();
  });

  it("returns 200 with paginated sessions and articleUrl projection", async () => {
    mockSessionFindMany.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        article_id: 1,
        total_active_time: 95,
        status: "COMPLETED",
        start_time: "2026-08-18T10:00:00.000Z",
        article: {
          id: 1,
          title: "Tracked Article",
          url: "https://dantri.com.vn/tracked",
        },
        events: [
          {
            id: "evt-1",
            event_type: "PAGE_ENTER",
            timestamp: "2026-08-18T10:00:00.000Z",
          },
        ],
      },
    ]);
    mockSessionCount.mockResolvedValue(1);

    const res = await request(app).get("/api/sessions?page=1&limit=10");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].articleUrl).toBe("https://dantri.com.vn/tracked");
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it("returns 500 when session query fails", async () => {
    mockSessionFindMany.mockRejectedValue(new Error("Prisma timeout"));

    const res = await request(app).get("/api/sessions");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  // Pattern D - Intentional Integration Failure #3 (Contract / Schema Drift):
  // Outdated test expects `res.body.meta` pagination envelope, whereas the API returns `res.body.pagination`.
  it("exposes outdated meta pagination key in response contract", async () => {
    mockSessionFindMany.mockResolvedValue([]);
    mockSessionCount.mockResolvedValue(0);

    const res = await request(app).get("/api/sessions?page=1&limit=10");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("meta");
  });
});
