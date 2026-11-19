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

describe("session.service Redundant Tests (Pattern C: Duplicate Assertions)", () => {
  const sampleSession = [
    {
      id: "dup-sess-1",
      article_id: 1,
      total_active_time: 75,
      article: { url: "https://vnexpress.net/dup" },
      events: [{ id: "e1", event_type: "PAGE_ENTER", timestamp: "2026-08-18T10:00:00.000Z" }],
    },
  ];

  beforeEach(() => {
    mockFindMany.mockResolvedValue(sampleSession);
    mockCount.mockResolvedValue(1);
  });

  it("should return paginated sessions with active duration", async () => {
    const res = await sessionService.getSessions(1, 10);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].total_active_time).toBe(75);
    expect(res.pagination.totalPages).toBe(1);
  });

  // Intentionally duplicates the exact same code path & assertions above
  it("test valid session pagination and duration computation", async () => {
    const res = await sessionService.getSessions(1, 10);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].total_active_time).toBe(75);
    expect(res.pagination.totalPages).toBe(1);
  });
});
