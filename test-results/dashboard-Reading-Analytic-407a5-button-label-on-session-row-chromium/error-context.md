# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.js >> Reading Analytics Dashboard E2E (Pattern E: Inverted Pyramid + Pattern D Fail) >> expects View Timeline button label on session row
- Location: tests\e2e\dashboard.spec.js:247:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'View Timeline' })
Expected: visible
Timeout: 2000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'View Timeline' }) with timeout 2000ms
  - waiting for getByRole('button', { name: 'View Timeline' })

```

```yaml
- heading "Reading Analytics Dashboard" [level=1]
- paragraph: Track your news reading behavior and statistics
- heading "Overall Statistics" [level=3]
- paragraph: Total Articles
- paragraph: "2"
- paragraph: Total Sessions
- paragraph: "5"
- paragraph: Active Sessions
- paragraph: "1"
- paragraph: Completed Sessions
- paragraph: "4"
- paragraph: Total Read Time
- paragraph: 6 min 5 sec
- paragraph: Avg Read Time/Session
- paragraph: 1 min 13 sec
- heading "Weekly Activity Trends" [level=3]
- list:
  - listitem:
    - img "Reading Time (min) legend icon"
    - text: Reading Time (min)
  - listitem:
    - img "Topics/Domains legend icon"
    - text: Topics/Domains
- application: Mon Tue Wed Thu Fri Sat Sun 0 3 6 9 12
- heading "User Interaction Patterns" [level=3]
- list:
  - listitem:
    - img "PAGE_ACTIVE legend icon"
    - text: PAGE_ACTIVE
  - listitem:
    - img "PAGE_ENTER legend icon"
    - text: PAGE_ENTER
  - listitem:
    - img "PAGE_LEAVE legend icon"
    - text: PAGE_LEAVE
- application
- heading "Session Lifecycle" [level=3]
- list:
  - listitem:
    - img "Active legend icon"
    - text: Active
  - listitem:
    - img "Completed legend icon"
    - text: Completed
- application
- heading "Most Engaging Articles" [level=3]
- paragraph: 1. AI Reading Benchmark Transforms News Analytics
- paragraph: vnexpress.net
- text: 3 reads
- heading "Articles Read" [level=2]
- table:
  - rowgroup:
    - row "Title Domain Reads Total Time":
      - columnheader "Title"
      - columnheader "Domain"
      - columnheader "Reads"
      - columnheader "Total Time"
  - rowgroup:
    - row "AI Reading Benchmark Transforms News Analytics vnexpress.net 3 4m 5s":
      - cell "AI Reading Benchmark Transforms News Analytics"
      - cell "vnexpress.net"
      - cell "3"
      - cell "4m 5s"
    - row "Digital Economy Growth Accelerates in Q4 dantri.com.vn 2 2m 0s":
      - cell "Digital Economy Growth Accelerates in Q4"
      - cell "dantri.com.vn"
      - cell "2"
      - cell "2m 0s"
- heading "Sessions" [level=2]
- table:
  - rowgroup:
    - row "Session ID Article Start Time Active Time URL Actions":
      - columnheader "Session ID"
      - columnheader "Article"
      - columnheader "Start Time"
      - columnheader "Active Time"
      - columnheader "URL"
      - columnheader "Actions"
  - rowgroup:
    - row "550e8400... AI Reading Benchmark Transforms News Analytics Aug 18, 2026, 04:00 PM 4m 5s Visit Link Expand":
      - cell "550e8400..."
      - cell "AI Reading Benchmark Transforms News Analytics"
      - cell "Aug 18, 2026, 04:00 PM"
      - cell "4m 5s"
      - cell "Visit Link":
        - link "Visit Link":
          - /url: https://vnexpress.net/ai-reading-benchmark-2026
      - cell "Expand":
        - button "Expand"
```

# Test source

```ts
  157 |       await new Promise((resolve) => setTimeout(resolve, 4000));
  158 |       try {
  159 |         await route.fulfill({
  160 |           status: 200,
  161 |           contentType: "text/plain; charset=UTF-8",
  162 |           body: "2",
  163 |         });
  164 |       } catch {
  165 |         // Page closed before long-poll completed
  166 |       }
  167 |     }
  168 |   });
  169 | 
  170 |   await page.route("http://localhost:5000/api/articles", async (route) => {
  171 |     await route.fulfill({
  172 |       status: 200,
  173 |       contentType: "application/json",
  174 |       body: JSON.stringify({ success: true, data: MOCK_ARTICLES }),
  175 |     });
  176 |   });
  177 | 
  178 |   await page.route("http://localhost:5000/api/sessions", async (route) => {
  179 |     await route.fulfill({
  180 |       status: 200,
  181 |       contentType: "application/json",
  182 |       body: JSON.stringify({
  183 |         success: true,
  184 |         data: MOCK_SESSIONS,
  185 |         pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  186 |       }),
  187 |     });
  188 |   });
  189 | 
  190 |   await page.route("http://localhost:5000/api/stats", async (route) => {
  191 |     await route.fulfill({
  192 |       status: 200,
  193 |       contentType: "application/json",
  194 |       body: JSON.stringify({ success: true, data: MOCK_STATS }),
  195 |     });
  196 |   });
  197 | }
  198 | 
  199 | test.describe("Reading Analytics Dashboard E2E (Pattern E: Inverted Pyramid + Pattern D Fail)", () => {
  200 |   test.beforeEach(async ({ page }) => {
  201 |     await mockBackendTransport(page);
  202 |   });
  203 | 
  204 |   test("loads dashboard, renders overall metrics, charts, and article/session tables", async ({
  205 |     page,
  206 |   }) => {
  207 |     await page.goto("/");
  208 | 
  209 |     await expect(
  210 |       page.getByRole("heading", { name: "Reading Analytics Dashboard" }),
  211 |     ).toBeVisible();
  212 |     await expect(page.getByText("Overall Statistics")).toBeVisible();
  213 |     await expect(page.getByText("Weekly Activity Trends")).toBeVisible();
  214 |     await expect(page.getByText("Most Engaging Articles")).toBeVisible();
  215 |     await expect(
  216 |       page.getByText("Digital Economy Growth Accelerates in Q4"),
  217 |     ).toBeVisible();
  218 |   });
  219 | 
  220 |   test("expands article AI summary and session event timeline", async ({
  221 |     page,
  222 |   }) => {
  223 |     await page.goto("/");
  224 | 
  225 |     await page
  226 |       .locator("table")
  227 |       .first()
  228 |       .getByText("AI Reading Benchmark Transforms News Analytics")
  229 |       .click();
  230 |     await expect(
  231 |       page.getByText(
  232 |         "AI systems now summarize and classify news reading sessions automatically.",
  233 |       ),
  234 |     ).toBeVisible();
  235 |     await expect(page.getByText("Technology, AI")).toBeVisible();
  236 | 
  237 |     await page.getByRole("button", { name: "Expand" }).click();
  238 |     await expect(page.getByRole("button", { name: "Collapse" })).toBeVisible();
  239 |     const sessionsTable = page.locator("table").nth(1);
  240 |     await expect(sessionsTable.getByText("Enter", { exact: true })).toBeVisible();
  241 |     await expect(sessionsTable.getByText("Active", { exact: true })).toBeVisible();
  242 |     await expect(sessionsTable.getByText("Leave", { exact: true })).toBeVisible();
  243 |   });
  244 | 
  245 |   // Pattern D - Intentional System/E2E Failure #4 (Selector / UI Text Mismatch):
  246 |   // Asserts a non-existent "View Timeline" action button instead of "Expand".
  247 |   test("expects View Timeline button label on session row", async ({
  248 |     page,
  249 |   }) => {
  250 |     await page.goto("/");
  251 | 
  252 |     await expect(
  253 |       page.getByRole("heading", { name: "Reading Analytics Dashboard" }),
  254 |     ).toBeVisible();
  255 |     await expect(
  256 |       page.getByRole("button", { name: "View Timeline" }),
> 257 |     ).toBeVisible({ timeout: 2000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  258 |   });
  259 | });
  260 | 
```