import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const mockEventFindFirst = jest.fn();
const mockEventCreate = jest.fn();
const mockArticleUpsert = jest.fn();
const mockSessionFindUnique = jest.fn();
const mockSessionFindFirst = jest.fn();
const mockSessionCreate = jest.fn();
const mockBroadcast = jest.fn();

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
  broadcastDashboardUpdate: mockBroadcast,
}));

const { default: eventRoutes } = await import(
  "../../src/routes/event.routes.js"
);

const app = express();
app.use(express.json());
app.use(eventRoutes);

describe("POST /api/events Integration (Pattern A: Gold Standard)", () => {
  beforeEach(() => {
    mockEventFindFirst.mockReset();
    mockEventCreate.mockReset();
    mockArticleUpsert.mockReset();
    mockSessionFindUnique.mockReset();
    mockSessionFindFirst.mockReset();
    mockSessionCreate.mockReset();
    mockBroadcast.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 201 and persists event through route -> controller -> service", async () => {
    mockArticleUpsert.mockResolvedValue({
      id: 1,
      url: "https://vnexpress.net/story-1",
      domain: "vnexpress.net",
      title: "Story 1",
      content: "Short body",
      summary: "Summary",
      topic: "Tech",
    });
    mockSessionFindUnique.mockResolvedValue(null);
    mockSessionFindFirst.mockResolvedValue(null);
    mockSessionCreate.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      article_id: 1,
    });
    mockEventCreate.mockResolvedValue({
      id: "evt-1",
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      event_type: "PAGE_ENTER",
      timestamp: "2026-08-18T12:00:00.000Z",
    });

    const res = await request(app).post("/api/events").send({
      event_type: "PAGE_ENTER",
      url: "https://vnexpress.net/story-1",
      title: "Story 1",
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-08-18T12:00:00.000Z",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.event_type).toBe("PAGE_ENTER");
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when Zod validation rejects invalid event_type", async () => {
    const res = await request(app).post("/api/events").send({
      event_type: "INVALID_EVENT",
      url: "https://vnexpress.net/story-1",
      title: "Story 1",
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-08-18T12:00:00.000Z",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockEventCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when downstream database call throws unexpectedly", async () => {
    mockArticleUpsert.mockRejectedValue(new Error("DB connection lost"));

    const res = await request(app).post("/api/events").send({
      event_type: "PAGE_ENTER",
      url: "https://vnexpress.net/story-1",
      title: "Story 1",
      domain: "vnexpress.net",
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: "2026-08-18T12:00:00.000Z",
    });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Internal server error");
  });
});
