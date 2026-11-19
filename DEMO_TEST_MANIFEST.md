# Demo Test Manifest — Reading Activity Tracker (`DiiD`)

Benchmark test suite intentionally engineered with mixed runners, coverage blind spots, redundant tests, cross-layer imbalances, and assertion-level failures for demonstrating AI-powered test coverage analysis and automated test generation.

---

## 1. Installed Testing Frameworks & Commands

| Layer | Framework / Runner | Config File | Directory | Run Command | Coverage Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Client Unit** | Vitest + React Testing Library + `@vitest/coverage-v8` (`jsdom`) | `client/vitest.config.js` | `client/tests/unit/` | `npm run test:unit:client` / `npm run test:coverage:client` | `client/coverage/` (`lcov.info`, `coverage-summary.json`) |
| **Server Unit** | Jest (`--experimental-vm-modules` + `--runInBand`) | `server/jest.config.js` | `server/tests/unit/` | `npm run test:unit:server` | `server/coverage/` (`lcov.info`, `coverage-summary.json`) |
| **Server Integration** | Jest + Supertest | `server/jest.config.js` | `server/tests/integration/` | `npm run test:integration` | `server/coverage/` (via `npm run test:coverage:server`) |
| **System / E2E** | Playwright Test (`chromium`) | `playwright.config.js` | `tests/e2e/` | `npm run test:e2e` | `playwright-report/` |

---

## 2. Pattern A: High Coverage & Happy Path ("The Gold Standard")

- **Server Session Service (`100%` Stmts / `91.66%` Branch):** `server/tests/unit/session.service.test.js` -> `server/src/services/session.service.js`
- **Server Events API (`100%` Route + Controller):** `server/tests/integration/events.integration.test.js` -> `server/src/routes/event.routes.js`, `server/src/controllers/event.controller.js`
- **Client `MetricCard` & `SessionEventTimeline`:** `client/tests/unit/MetricCard.test.jsx`, `client/tests/unit/SessionEventTimeline.test.jsx`

---

## 3. Pattern B: Intentional Coverage Gaps

### 0% Coverage Modules (Demonstrate AI Test Generation from Scratch)
- **AI Summarization & Classification (40% untested route group):**
  - `server/src/routes/ai.routes.js` (`POST /summarize`, `POST /classify`)
  - `server/src/controllers/ai.controller.js`
  - `server/src/services/ai.service.js`
- **Stats HTTP Endpoint (40% untested route group):**
  - `server/src/routes/stats.routes.js` (`GET /api/stats`)
  - `server/src/controllers/stats.controller.js`
- **Background Cron, Error Middleware & WebSocket Server:**
  - `server/src/cron/cleanup.cron.js`
  - `server/src/middlewares/error.middleware.js`
  - `server/src/config/socket.js`
- **Frontend Chart & Skeleton Components (0% Unit Coverage):**
  - `client/src/components/TopicDomainChart.jsx`
  - `client/src/components/ChartSkeleton.jsx`
- **Chrome Extension (0% Automated Coverage):**
  - `extension/content.js`, `extension/popup.js`, `extension/background.js`

### Partial / Branch-Gap Modules (Demonstrate CFG / Branch Coverage Improvement)
- `server/src/services/event.service.js` (`~32.81%` Stmts / `35.84%` Branch) — tested by `server/tests/unit/event.service.partial.test.js`:
  - **Untested branches:** non-`PAGE_ENTER` deduplication window, `P2002` Prisma unique-constraint catch blocks, `recentCompletedSession` ghost guard, `PAGE_LEAVE` active-time summation & zero-second session deletion, auto-AI summarization trigger & `.catch()`.
- `server/src/services/article.service.js` (`50%` Stmts / `31.03%` Branch) — tested by `server/tests/unit/article.service.partial.test.js`:
  - **Untested branches:** `ACTIVE` session real-time `calculateActiveTimeForSession` loop, auto-AI summary generation + `catch` fallback, empty sessions boundary.
- `server/src/controllers/article.controller.js` (`30.43%` Stmts):
  - **Untested methods:** `addArticle`, `updateArticle`, `deleteArticle`, and `getArticles` 500 error catch branch.
- `client/src/components/ArticleList.jsx` — tested by `client/tests/unit/ArticleList.partial.test.jsx`:
  - **Untested branches:** empty `articles` state, `totalReadTime` camelCase fallback, missing `summary`/`topic` placeholders, row collapse on second click.

---

## 4. Pattern C: Redundant & Duplicate Tests ("The Noise")

- `server/tests/unit/session.redundant.test.js`:
  - Two overlapping tests (`should return paginated sessions with active duration` and `test valid session pagination and duration computation`) executing the identical `sessionService.getSessions(1, 10)` code path and assertions.
- `server/tests/integration/articles.redundant.integration.test.js`:
  - Duplicates `server/tests/integration/articles.integration.test.js` (`GET /api/articles`) with no additional line or branch coverage.
- `client/tests/unit/MetricCard.redundant.test.jsx`:
  - Two duplicate tests (`should render metric title and numeric value` and `displays card heading and count prop on screen`) hitting the same render branch.
- `client/tests/unit/LoadingSpinner.redundant.test.jsx`:
  - Over-mocked (`vi.useFakeTimers()`, `ResizeObserver` stub) test for `LoadingSpinner.jsx`, which is already implicitly covered by `client/tests/unit/MetricCard.test.jsx`.

---

## 5. Pattern D: Intentional Failing Tests (Assertion-Level Diagnostics)

| # | Level & Runner | File | Test Name | Expected vs Actual (Root Cause) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Unit (Vitest)** | `client/tests/unit/ArticleList.partial.test.jsx` | `formats negative read duration as 00:00` | Expects `"00:00"` for `total_read_time: -5`, but `ArticleList.jsx` `formatTime` renders `"0m 0s"`. |
| 2 | **Unit (Jest)** | `server/tests/unit/stats.service.test.js` | `returns null avgReadTimePerArticle when no articles exist` | Expects `null` when `articles` is `[]`, but `stats.service.js` returns `0`. |
| 3 | **Integration (Jest + Supertest)** | `server/tests/integration/sessions.integration.test.js` | `exposes outdated meta pagination key in response contract` | Contract drift: expects `res.body.meta`, but `session.controller.js` returns `res.body.pagination`. |
| 4 | **System / E2E (Playwright)** | `tests/e2e/dashboard.spec.js` | `expects View Timeline button label on session row` | Selector/text mismatch: looks for `"View Timeline"`, but `SessionList.jsx` renders `"Expand"`. |

---

## 6. Pattern E: Cross-Layer Overlap & Imbalance ("The Inverted Pyramid")

- **Heavy E2E & Integration, 0% Unit:** `client/src/components/SessionList.jsx` and `client/src/components/TopicDomainChart.jsx` are exercised end-to-end in `tests/e2e/dashboard.spec.js` and backed by `/api/sessions` + `/api/articles` integration tests, yet have **0% unit tests**.
- **High Unit (~94%), 0% Integration:** `server/src/services/stats.service.js` has `94.31%` statement coverage via `server/tests/unit/stats.service.test.js`, while `GET /api/stats` (`server/src/routes/stats.routes.js` and `server/src/controllers/stats.controller.js`) has **0% integration coverage**.
