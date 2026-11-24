# DiiD (Reading Activity Tracker) - Internal Project Knowledge Base

## 1. Tong quan he thong (System Overview)
DiiD la he thong theo doi, luu tru, xu ly va phan tich hanh vi doc bao tren trinh duyet Chrome theo thoi gian thuc.
He thong gom 3 tang chinh + 1 khu vuc Sandbox tach biet:
1. **Chrome Extension (`extension/`)**: Manifest V3, trich xuat noi dung bai bao va ghi nhan cac su kien doc bai tren trinh duyet.
2. **Backend Server (`server/`)**: Node.js (ESM), Express 5.2.1, Prisma ORM 5.22.0 (MySQL), Socket.io 4.8.3, Zod 4.4.3, `node-cron`, `@google/generative-ai`, va `stripe` (cho khu vuc sandbox). Chay mac dinh tai port `5000` (`PORT` trong `server/.env`).
3. **Frontend Dashboard (`client/`)**: React 19.2.8, Vite 8.2.0, Tailwind CSS 4.3.3, Recharts, Axios, `socket.io-client`. Chay dev tai port `5173` (proxy `/api` -> `http://localhost:5000`).
4. **Test Sandbox (`/sandbox`)**: Trang tach biet khoi dashboard chinh, cung cap cong thanh toan Stripe test va chatbox AI hoi dap chuc nang noi bo du an.

---

## 2. Chrome Extension (`extension/`)
- **Files**:
  - `extension/manifest.json`: Manifest V3, quyen `storage`, `activeTab`, `alarms`; `host_permissions` cho `vnexpress.net`, `dantri.com.vn`, `tuoitre.vn`, `http://localhost:5000/*`.
  - `extension/content.js`: Inject vao trang bao khi `document_idle`. (Luu y: `extension/config.js` khong con export bien ma da gop cau hinh truc tiep vao `content.js`).
  - `extension/background.js`: Service worker nhan message `LOG_EVENT`, xu ly `onInstalled`, va tao alarm `cleanupOldEvents` chay moi 60 phut de xoa `pendingEvents` trong `chrome.storage.local` cu hon 7 ngay.
  - `extension/popup.html` & `extension/popup.js`: Hien thi `sessionId` rut gon, thoi gian doc uoc tinh tu `pendingEvents` trong `chrome.storage.local`, va nut mo Dashboard (`http://localhost:5173`).
- **Website & CSS Selectors duoc theo doi**:
  - `vnexpress.net`: `.container`, `.detail-new`
  - `dantri.com.vn`: `#articleContent`
  - `tuoitre.vn`: `.main-detail`, `#detail__cmain`
  - Fallback: the `<article>`, sau do den cac the `<p>` hoac `document.body.innerText`.
- **Cau hinh tracking trong `content.js`**:
  - `API_URL`: `http://localhost:5000/api/events`
  - `INACTIVITY_TIMEOUT`: `30000` ms (30 giay khong hoat dong chuyen sang inactive)
  - `THROTTLE_DELAY`: `1000` ms
  - Cac loai su kien (`EVENT_TYPES`): `PAGE_ENTER`, `PAGE_ACTIVE`, `PAGE_INACTIVE`, `PAGE_LEAVE`.

---

## 3. Co so du lieu MySQL & Prisma Schema (`server/prisma/schema.prisma`)
Co 3 bang (models) chinh:
1. **`Article` (`articles`)**:
   - `id` (Int, autoincrement PK), `url` (VarChar 500, unique), `domain` (VarChar 100), `title` (VarChar 500), `content` (LongText), `summary` (LongText, nullable), `topic` (VarChar 255, nullable), `category` (VarChar 100, nullable), `confidence` (Float, nullable), `created_at` (DateTime).
   - Quan he 1-nhieu voi `Session`.
2. **`Session` (`sessions`)**:
   - `id` (VarChar 36 UUID PK), `article_id` (Int FK -> `articles.id`, onDelete Cascade), `start_time`, `end_time` (nullable), `total_active_time` (Int, default 0, don vi giay), `status` (`SessionStatus`: `ACTIVE` | `COMPLETED`), `created_at`, `updated_at`.
   - Quan he 1-nhieu voi `Event`.
3. **`Event` (`events`)**:
   - `id` (VarChar 36 UUID PK), `session_id` (VarChar 36 FK -> `sessions.id`, onDelete Cascade), `event_type` (`EventType`: `PAGE_ENTER` | `PAGE_ACTIVE` | `PAGE_INACTIVE` | `PAGE_LEAVE`), `timestamp`, `metadata` (Json, nullable).

---

## 4. Cac chuc nang Backend & API Endpoints (`server/src/`)
### 4.1. Thu thap su kien doc bai - `POST /api/events`
- Files: `routes/event.routes.js`, `controllers/event.controller.js`, `services/event.service.js`.
- Validate payload bang Zod (`eventSchema`): `event_type`, `url`, `title`, `domain?`, `content?`, `timestamp`, `session_id`, `metadata?`.
- **Chong trung lap & race condition**:
  - Cac su kien khac `PAGE_ENTER` bi bo qua neu cung `session_id` va `event_type` da xuat hien trong 5 giay gan nhat.
  - Upsert `Article` theo `url`, bat ma loi `P2002` khi co concurrent upsert.
  - Chong "ghost session": neu bai bao co session `COMPLETED` trong 10 phut gan nhat va su kien gui len la `PAGE_ENTER` cho session chua ton tai thi tra ve `"Ghost session ignored"`.
  - Neu dang co session chua `COMPLETED` cho `article_id` do thi tai su dung session do.
- Sau khi luu su kien thanh cong, goi `broadcastDashboardUpdate()` de phat su kien `dashboard_update` qua Socket.io.

### 4.2. Quan ly bai bao & tu dong tom tat AI - `GET /api/articles`
- Files: `routes/article.routes.js`, `controllers/article.controller.js`, `services/article.service.js`.
- Lay danh sach `Article` kem `sessions` va `events`.
- Neu bai bao chua co `summary` hoac `topic` va `content.length > 100`, tu dong goi `aiService.summarizeAndClassify(article.content)` va luu vao database.
- Tinh toan cac chi so cho tung bai bao: `read_count`, `total_read_time`, `active_sessions`, `completed_sessions`, `avg_session_time`, `event_activity_counts`.

### 4.3. Danh sach phien doc - `GET /api/sessions`
- Files: `routes/session.routes.js`, `controllers/session.controller.js`, `services/session.service.js`.
- Ho tro phan trang (`page`, `limit`).
- Tra ve `data` (kem `article`, `articleUrl`, va `events` da sap xep tang dan theo `timestamp`) va `pagination` (`page`, `limit`, `total`, `totalPages`).
- Neu `total_active_time` cua session bang 0/thieu, tinh lai tu cac cap su kien `PAGE_ACTIVE` -> `PAGE_INACTIVE` (hoac den event cuoi).
- Loc bo cac session co `total_active_time === 0` va khong co `events`.

### 4.4. Thong ke tong hop - `GET /api/stats`
- Files: `routes/stats.routes.js`, `controllers/stats.controller.js`, `services/stats.service.js`.
- Tra ve:
  - `weeklyStats`: mang 7 ngay tu Monday den Sunday trong tuan hien tai voi `readingTime` (phut) va `topics` (so domain doc nhat).
  - `articleSessionStats`: `summary` (tong bai bao, tong session, active/completed, tong thoi gian doc, trung binh), `eventActivity` (dem theo loai su kien), `topArticles`.

### 4.5. AI Tom tat & Phan loai bai bao - `POST /api/summarize` & `POST /api/classify`
- Files: `routes/ai.routes.js`, `controllers/ai.controller.js`, `services/ai.service.js`.
- Model mac dinh: `gemini-3.5-flash-lite` (qua `@google/generative-ai`).
- `POST /api/summarize`: nhan `{ content }`, tra ve `{ summary }` (3-5 cau).
- `POST /api/classify`: nhan `{ content }`, tra ve `{ topics }`.
- Ham `AIService.summarizeAndClassify(articleText)` phan loai vao 8 nhom: `Technology`, `Economy`, `Politics`, `Sports`, `Education`, `Health`, `Entertainment`, `Others`, kem `confidence` (0.0 - 1.0). Yeu cau `articleText` dai it nhat 20 ky tu.

### 4.6. Cron Job & Realtime Socket.io
- `cron/cleanup.cron.js`: Lich `*/1 * * * *` (chay moi phut), tu dong chuyen cac session `ACTIVE` co `updated_at` cu hon 5 phut thanh `COMPLETED`.
- `config/socket.js` & `utils/dashboard.util.js`: Khoi tao Socket.io voi CORS `http://localhost:5173`. Khi co cap nhat du lieu, server emit `dashboard_update` de Frontend tai lai du lieu realtime.

---

## 5. Frontend Dashboard (`client/src/`)
- `App.jsx`: Trang chinh tai `/`, goi song song `GET /api/articles`, `/api/sessions`, `/api/stats` va lang nghe `dashboard_update` qua `socket.io-client`.
- Components:
  - `TopicDomainChart.jsx`: Hien thi metric tong quan (`MetricCard`), bieu do xu huong doc theo tuan va phan bo chu de/domain (Recharts).
  - `ArticleList.jsx`: Bang danh sach bai bao da doc, click vao dong de mo rong xem `summary` va `topic` do AI tao.
  - `SessionList.jsx` & `SessionEventTimeline.jsx`: Bang phien doc co nut `Expand`/`Collapse` de xem timeline chi tiet tung su kien (`Enter`, `Active`, `Inactive`, `Leave`).
  - `LoadingSpinner.jsx` & `ChartSkeleton.jsx`: Trang thai loading.

---

## 6. Kiem thu (Testing)
- Root `package.json`:
  - `npm run test:unit:client` (Vitest)
  - `npm run test:unit:server` (Jest `--experimental-vm-modules`)
  - `npm run test:integration` (Jest + Supertest)
  - `npm run test:e2e` (Playwright, chay tren `http://127.0.0.1:4173` theo `playwright.config.js`, test file `tests/e2e/dashboard.spec.js`)
  - Luu y: Bo test benchmark co chua mot so test case co tinh fail theo Pattern D (nhu `stats.service.test.js`, `ArticleList.partial.test.jsx`, `dashboard.spec.js` test `View Timeline`).

---

## 7. Khu vuc Sandbox (`/sandbox`)
- Tach biet hoan toan voi Dashboard chinh (`client/src/main.jsx` re nhanh theo `window.location.pathname` bat dau bang `/sandbox`).
- Gom 2 tinh nang de test tu trang khac:
  1. **Stripe Payment Sandbox**: `POST /api/sandbox/payments/checkout-session`, `GET /api/sandbox/payments/checkout-session/:sessionId`, `POST /api/sandbox/payments/test-intent`, `GET /api/sandbox/payments/recent`.
  2. **Chatbox AI hoi dap noi bo du an**: `POST /api/sandbox/chat`, `GET /api/sandbox/config`, su dung du lieu kien thuc tai `server/src/data/sandbox/project-knowledge.md` va prompt tai `server/src/data/sandbox/system-prompt.txt` & `faq-prompts.json`.
