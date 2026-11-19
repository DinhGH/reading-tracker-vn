import { test, expect } from "@playwright/test";

const MOCK_ARTICLES = [
  {
    id: 1,
    url: "https://vnexpress.net/ai-reading-benchmark-2026",
    domain: "vnexpress.net",
    title: "AI Reading Benchmark Transforms News Analytics",
    content: "Full article body...",
    summary: "AI systems now summarize and classify news reading sessions automatically.",
    topic: "Technology, AI",
    read_count: 3,
    total_read_time: 245,
    active_sessions: 1,
    completed_sessions: 2,
    avg_session_time: 82,
    event_activity_counts: { PAGE_ENTER: 3, PAGE_ACTIVE: 3, PAGE_LEAVE: 2 },
  },
  {
    id: 2,
    url: "https://dantri.com.vn/kinh-te-so-2026",
    domain: "dantri.com.vn",
    title: "Digital Economy Growth Accelerates in Q4",
    content: "Economic report body...",
    summary: "Digital transformation lifts regional productivity metrics.",
    topic: "Economy",
    read_count: 2,
    total_read_time: 120,
    active_sessions: 0,
    completed_sessions: 2,
    avg_session_time: 60,
    event_activity_counts: { PAGE_ENTER: 2, PAGE_ACTIVE: 2, PAGE_LEAVE: 2 },
  },
];

const MOCK_SESSIONS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    article_id: 1,
    start_time: "2026-08-18T09:00:00.000Z",
    end_time: "2026-08-18T09:04:05.000Z",
    total_active_time: 245,
    status: "COMPLETED",
    articleUrl: "https://vnexpress.net/ai-reading-benchmark-2026",
    article: {
      id: 1,
      title: "AI Reading Benchmark Transforms News Analytics",
      url: "https://vnexpress.net/ai-reading-benchmark-2026",
      domain: "vnexpress.net",
    },
    events: [
      {
        id: "evt-1",
        event_type: "PAGE_ENTER",
        timestamp: "2026-08-18T09:00:00.000Z",
      },
      {
        id: "evt-2",
        event_type: "PAGE_ACTIVE",
        timestamp: "2026-08-18T09:00:05.000Z",
      },
      {
        id: "evt-3",
        event_type: "PAGE_LEAVE",
        timestamp: "2026-08-18T09:04:05.000Z",
      },
    ],
  },
];

const MOCK_STATS = {
  weeklyStats: [
    { day: "Monday", readingTime: 12, topics: 2 },
    { day: "Tuesday", readingTime: 8, topics: 1 },
    { day: "Wednesday", readingTime: 0, topics: 0 },
    { day: "Thursday", readingTime: 0, topics: 0 },
    { day: "Friday", readingTime: 0, topics: 0 },
    { day: "Saturday", readingTime: 0, topics: 0 },
    { day: "Sunday", readingTime: 0, topics: 0 },
  ],
  articleSessionStats: {
    summary: {
      totalArticles: 2,
      totalSessions: 5,
      activeSessions: 1,
      completedSessions: 4,
      totalReadTime: 365,
      avgReadTimePerArticle: 183,
      avgReadTimePerSession: 73,
    },
    eventActivity: {
      PAGE_ENTER: 5,
      PAGE_ACTIVE: 5,
      PAGE_LEAVE: 4,
    },
    topArticles: [
      {
        id: 1,
        title: "AI Reading Benchmark Transforms News Analytics",
        domain: "vnexpress.net",
        read_count: 3,
        total_read_time: 4,
        avg_session_time: 82,
      },
    ],
  },
  topArticles: [
    {
      id: 1,
      title: "AI Reading Benchmark Transforms News Analytics",
      domain: "vnexpress.net",
      read_count: 3,
      total_read_time: 4,
      avg_session_time: 82,
    },
  ],
};

async function mockBackendTransport(page) {
  let connectAckSent = false;

  await page.route("http://localhost:5000/socket.io/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const sid = url.searchParams.get("sid");

    if (!sid && req.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=UTF-8",
        body: '0{"sid":"e2e-sid-1","upgrades":[],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}',
      });
      return;
    }

    if (req.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=UTF-8",
        body: "ok",
      });
      return;
    }

    if (sid && req.method() === "GET") {
      if (!connectAckSent) {
        connectAckSent = true;
        await route.fulfill({
          status: 200,
          contentType: "text/plain; charset=UTF-8",
          body: '40{"sid":"e2e-ns-1"}',
        });
        return;
      }

      // Hold subsequent long-poll requests briefly to avoid tight polling loops
      await new Promise((resolve) => setTimeout(resolve, 4000));
      try {
        await route.fulfill({
          status: 200,
          contentType: "text/plain; charset=UTF-8",
          body: "2",
        });
      } catch {
        // Page closed before long-poll completed
      }
    }
  });

  await page.route("http://localhost:5000/api/articles", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: MOCK_ARTICLES }),
    });
  });

  await page.route("http://localhost:5000/api/sessions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: MOCK_SESSIONS,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    });
  });

  await page.route("http://localhost:5000/api/stats", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: MOCK_STATS }),
    });
  });
}

test.describe("Reading Analytics Dashboard E2E (Pattern E: Inverted Pyramid + Pattern D Fail)", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendTransport(page);
  });

  test("loads dashboard, renders overall metrics, charts, and article/session tables", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Reading Analytics Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Overall Statistics")).toBeVisible();
    await expect(page.getByText("Weekly Activity Trends")).toBeVisible();
    await expect(page.getByText("Most Engaging Articles")).toBeVisible();
    await expect(
      page.getByText("Digital Economy Growth Accelerates in Q4"),
    ).toBeVisible();
  });

  test("expands article AI summary and session event timeline", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .locator("table")
      .first()
      .getByText("AI Reading Benchmark Transforms News Analytics")
      .click();
    await expect(
      page.getByText(
        "AI systems now summarize and classify news reading sessions automatically.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Technology, AI")).toBeVisible();

    await page.getByRole("button", { name: "Expand" }).click();
    await expect(page.getByRole("button", { name: "Collapse" })).toBeVisible();
    const sessionsTable = page.locator("table").nth(1);
    await expect(sessionsTable.getByText("Enter", { exact: true })).toBeVisible();
    await expect(sessionsTable.getByText("Active", { exact: true })).toBeVisible();
    await expect(sessionsTable.getByText("Leave", { exact: true })).toBeVisible();
  });

  // Pattern D - Intentional System/E2E Failure #4 (Selector / UI Text Mismatch):
  // Asserts a non-existent "View Timeline" action button instead of "Expand".
  test("expects View Timeline button label on session row", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Reading Analytics Dashboard" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View Timeline" }),
    ).toBeVisible({ timeout: 2000 });
  });
});
