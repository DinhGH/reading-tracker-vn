# Reading Activity Tracker - Full-Stack System

A comprehensive system for tracking, storing, processing, and analyzing user reading behavior on Chrome. This project combines a Chrome extension, backend server, and frontend dashboard to provide real-time insights into news reading patterns.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [Features](#features)
- [Edge Cases & Solutions](#edge-cases--solutions)
- [API Documentation](#api-documentation)
- [Technical Decisions](#technical-decisions)
- [Limitations & Future Work](#limitations--future-work)

## 🏗️ Architecture Overview

The system follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  (Content extraction, Event tracking, Data collection)       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                  Backend Server                              │
│  (Express.js, Prisma ORM, Business Logic, Real-time)        │
│  ├─ Routes (event, session, article endpoints)              │
│  ├─ Controllers (request handling & validation)             │
│  ├─ Services (business logic & database operations)         │
│  └─ Database (MySQL with Prisma schema)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                Frontend Dashboard                            │
│  (React, Tailwind CSS, Real-time updates via Socket.io)     │
│  ├─ Metric cards (key statistics)                           │
│  ├─ Article & Session tables                                │
│  └─ Real-time Socket.io integration                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Extension → Server**: User interactions on news websites are tracked and sent as events
2. **Server → Database**: Events are validated, deduplicated, and persisted
3. **Dashboard ← Server**: Frontend fetches and displays data with real-time updates

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js (ESM modules)
- **Framework**: Express.js 5.2.1
- **Database**: MySQL (via Railway)
- **ORM**: Prisma v5.22.0
- **Real-time**: Socket.io 4.8.3
- **Validation**: Zod 4.4.3
- **AI Integration**: Google Generative AI SDK (`@google/genai`)

### Frontend

- **Framework**: React 19.2.8
- **Build Tool**: Vite 8.2.0
- **Styling**: Tailwind CSS 4.3.3
- **Icons**: Lucide React 1.31.0
- **Charts**: Recharts 3.10.1
- **HTTP**: Axios 1.19.0
- **Real-time**: Socket.io-client 4.8.3

### Extension

- **Format**: Chrome Extension Manifest V3
- **Language**: Vanilla JavaScript (no build step)
- **Storage**: Chrome Local Storage API

## 📁 Project Structure

```
DiiD/
├── server/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js          # Prisma client configuration
│   │   ├── routes/
│   │   │   ├── event.routes.js    # Event endpoints
│   │   │   ├── session.routes.js  # Session endpoints
│   │   │   └── article.routes.js  # Article endpoints
│   │   ├── controllers/
│   │   │   ├── event.controller.js
│   │   │   ├── session.controller.js
│   │   │   └── article.controller.js
│   │   ├── services/
│   │   │   ├── event.service.js
│   │   │   ├── session.service.js
│   │   │   └── article.service.js
│   │   ├── middlewares/
│   │   │   └── error.middleware.js
│   │   └── index.js               # Express app setup
│   ├── .env                        # Environment variables
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricCard.jsx
│   │   │   ├── ArticleList.jsx
│   │   │   └── SessionList.jsx
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Tailwind imports
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── extension/
│   ├── manifest.json              # Chrome extension manifest
│   ├── content.js                 # Content script (main tracking logic)
│   ├── config.js                  # Extension configuration
│   ├── background.js              # Background script
│   ├── popup.html                 # Popup UI
│   └── popup.js                   # Popup logic
│
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js 16+ and npm
- MySQL database (Railway recommended)
- Google Generative AI API key
- Chrome browser

### Step 1: Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install
npx prisma generate

# Install client dependencies
cd ../client
npm install

# Extension requires no installation (uses vanilla JS)
```

### Step 2: Configure Environment Variables

Create `server/.env`:

```env
PORT=5000
DATABASE_URL="mysql://username:password@host:port/database"
GEMINI_API_KEY="your-google-genai-api-key"
```

### Step 3: Initialize Database

```bash
cd server
npx prisma migrate dev
npx prisma db push
```

## 🎯 Running the Project

---

### Examples & Results

**Below are examples of the outputs users can expect:**

#### Dashboard Live Demo

Sample image of the professional dashboard during use:
![Dashboard Example](./public/dashboard-example.png)

#### AI Summarization/Classification Results

Example result of summarization and topic detection API:

```json
{
  "summary": "This article discusses the advancements in AI technology for summarization tasks.",
  "category": "Technology",
  "confidence": 0.91
}
}
```

Refer to the `Edge Cases & Solutions` for how scenarios like multi-tab browsing or offline handling are robustly addressed.

### Terminal 1: Start Backend Server

```bash
cd server
npm run dev    # Development mode with nodemon
# or
npm start      # Production mode
```

Server runs on `http://localhost:5000`

### Terminal 2: Start Frontend Dashboard

```bash
cd client
npm run dev
```

Dashboard runs on `http://localhost:5173`

### Terminal 3: Load Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. Extension is now active on supported websites

## ✨ Features

### ✅ Implemented

- [x] Chrome Extension for data collection on VnExpress, Dân Trí, Tuổi Trẻ
- [x] Real-time event tracking (PAGE_ENTER, PAGE_ACTIVE, PAGE_INACTIVE, PAGE_LEAVE)
- [x] Session management with activity time calculation
- [x] Professional React dashboard with metric cards
- [x] Articles and sessions table with sorting/filtering
- [x] Responsive UI with Tailwind CSS
- [x] Error handling and validation (Zod)
- [x] Offline queue for failed event submissions
- [x] Socket.io real-time updates setup
- [x] Server-side error middleware
- [x] AI article summarization (Google Generative AI integration)
- [x] Article category classification
- [x] Reading preference analysis

### 🔲 Not Implemented / In Progress

- [ ] Reading time prediction
- [ ] Advanced analytics charts (visuals)

## 🌟 Real-World Scenarios

Here’s how the system effectively handles various real-world situations:

### 1. Simultaneous Multiple Tabs

- **Issue**: Tracking accurate active times across multiple tabs.
- **Solution**: Each tab generates a unique `session_id`. Only tabs marked visible (`document.visibilityState === 'visible'`) increment the timer for reading activity.

### 2. Frequent Tab Switching

- **Issue**: Excessive events sent while a user rapidly switches tabs.
- **Solution**: Event processing uses a throttle mechanism. Delays prevent redundant network calls, optimizing server load.

### 3. Prolonged Inactivity

- **Issue**: Long periods of inactivity incorrectly count as active reading time.
- **Solution**: Tabs detect user inactivity after 30 seconds and emit a `PAGE_INACTIVE` event, which pauses the session timer.

### 4. Abrupt Chrome Browser Closure

- **Issue**: Missing `PAGE_LEAVE` events with sudden exits.
- **Solution**: Events are transmitted via `navigator.sendBeacon()` on `beforeunload` and `pagehide`. Batch processing ensures no session remains open indefinitely.

### 5. Duplicate Event Submissions

- **Issue**: Duplicates caused by restarts or connection retries.
- **Solution**: Each event carries a unique ID (`event_id`). Database constraints prevent duplicate entries.

### 6. Internet Connectivity Loss

- **Issue**: Lost events when the user is temporarily offline.
- **Solution**: Events are stored locally and automatically retried once connectivity resumes.

### 7. Changing HTML Structures on Websites

- **Issue**: Extracting article data fails if website structure updates.
- **Solution**: The extension applies fallback mechanisms:
  - Maintains specific site rules (e.g., VnExpress → Dân Trí).
  - Uses general `<article>` tags.
  - Parses `<p>` elements incrementally when needed.

Refer to "Edge Cases & Solutions" for implementation details on each case.

### 1. **User Opens Multiple Tabs Simultaneously**

**Problem**: How to prevent counting the same user twice?

**Solution**:

- Each tab generates a unique `session_id` on page load
- Only tabs with `document.visibilityState === 'visible'` increment the active timer
- Sessions are independent; multiple tabs = multiple sessions (by design, shows true reading behavior)

```javascript
// In content.js
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isPageActive = false;
  } else {
    isPageActive = true;
    recordActivity();
  }
});
```

### 2. **User Switches Between Tabs Rapidly**

**Problem**: Rapid tab switching causes excessive events.

**Solution**:

- Implemented throttling with 1000ms delay for activity tracking
- `visibilitychange` events are not throttled but are efficient
- Events are sent after throttle delay, reducing server load

```javascript
const recordActivity = throttle(() => {
  // Activity tracking logic
}, THROTTLE_DELAY); // 1000ms
```

### 3. **User Leaves Tab Open Without Interaction**

**Problem**: Counting inactive time as active reading time.

**Solution**:

- Idle timer starts after 30 seconds of no user interaction
- `PAGE_INACTIVE` event is sent to pause the reading timer
- Interaction resumes tracking with `PAGE_ACTIVE` event

```javascript
inactivityTimer = setTimeout(() => {
  if (isPageActive) {
    isPageActive = false;
    sendEvent({
      event_type: "PAGE_INACTIVE",
      // ...
    });
  }
}, INACTIVITY_TIMEOUT); // 30 seconds
```

### 4. **User Closes Browser Without Sending PAGE_LEAVE**

**Problem**: Sessions remain in "ACTIVE" state indefinitely.

**Solution**:

- Use `navigator.sendBeacon()` on `beforeunload` and `pagehide` events
- Server-side cron job (planned) to auto-close sessions inactive for 5+ minutes
- Beacon is guaranteed to be sent even during browser shutdown

```javascript
window.addEventListener("beforeunload", () => {
  sendEventWithBeacon({
    event_type: "PAGE_LEAVE",
    // ...
  });
});
```

### 5. **Extension Sends Duplicate Events**

**Problem**: Network retry or user refresh causes event duplicates.

**Solution**:

- Each event has a unique `event_id` (UUID)
- Database enforces unique constraint on `event_id`
- Idempotent API design prevents duplicate processing

**Prisma Schema**:

```prisma
model Event {
  id String @id @db.VarChar(36)  // UUID primary key
  // Duplicate IDs will be rejected
}
```

### 6. **Internet Connection Drops**

**Problem**: Events are lost when user is offline.

**Solution**:

- Failed events are stored in `chrome.storage.local`
- When connection is restored, `online` event listener triggers flush
- Automatic retry mechanism for pending events

```javascript
window.addEventListener("online", () => {
  flushPendingEvents();
});

function storePendingEvent(event) {
  const events = JSON.parse(localStorage.getItem("pendingEvents") || "[]");
  events.push(event);
  localStorage.setItem("pendingEvents", JSON.stringify(events));
}
```

### 7. **Website Changes HTML Structure**

**Problem**: CSS selectors no longer match article content.

**Solution**:

- Intelligent fallback selectors (VnExpress → Dân Trí → Tuổi Trẻ → generic)
- Generic `<article>` tag fallback
- Last resort: parse all `<p>` tags and extract text
- Graceful degradation: empty content is acceptable

```javascript
function extractArticleContent() {
  // Try specific selectors first
  let article = document.querySelector("article.fck_detail"); // VnExpress
  if (article) return article.innerText;

  article = document.querySelector(".dt-news-content"); // Dân Trí
  if (article) return article.innerText;

  // Fallback to generic article tag
  article = document.querySelector("article");
  if (article) return article.innerText;

  // Last resort: gather all paragraphs
  return Array.from(document.querySelectorAll("p"))
    .map((p) => p.textContent)
    .join(" ");
}
```

## 📡 API Documentation

### POST /api/events

Send tracking events from extension.

**Request**:

```json
{
  "event_type": "PAGE_ENTER | PAGE_ACTIVE | PAGE_INACTIVE | PAGE_LEAVE",
  "url": "https://vnexpress.net/...",
  "title": "Article title",
  "domain": "vnexpress.net",
  "content": "Article content...",
  "session_id": "uuid",
  "timestamp": "2026-08-18T20:30:00Z",
  "metadata": {}
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_type": "PAGE_ENTER",
    "session_id": "uuid",
    "timestamp": "2026-08-18T20:30:00Z"
  }
}
```

### GET /api/articles

Retrieve all articles with read statistics.

**Query Parameters**:

- None (full list)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "https://vnexpress.net/...",
      "domain": "vnexpress.net",
      "title": "Article title",
      "content": "...",
      "summary": null,
      "category": null,
      "read_count": 2,
      "total_read_time": 450
    }
  ]
}
```

### GET /api/sessions

Retrieve sessions with pagination.

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "article_id": 1,
      "start_time": "2026-08-18T20:30:00Z",
      "end_time": null,
      "total_active_time": 120,
      "status": "ACTIVE",
      "article": {
        /* article data */
      },
      "events": [
        /* event timeline */
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

## 💡 Technical Decisions

### 1. Event-Based Architecture

**Why**: Instead of sending a single summary after reading, we send multiple events.

**Benefits**:

- Captures precise reading behavior (pause/resume patterns)
- Enables real-time analytics
- Allows reconstruction of reading timeline
- Better accuracy in active time calculation

### 2. Idempotent API with UUIDs

**Why**: Each event has a unique UUID as primary key.

**Benefits**:

- Handles network retries gracefully
- No duplicate data in database
- Simplifies client-side implementation

### 3. Throttled Activity Tracking

**Why**: Limit event frequency to prevent server overload.

**Benefits**:

- Reduces network traffic by ~90%
- Prevents database bottleneck
- User interactions still captured accurately
- Configurable via `THROTTLE_DELAY`

### 4. Vanilla JavaScript for Extension

**Why**: No build step for extension.

**Benefits**:

- Instant deployment without compilation
- Minimal bundle size
- No dependency vulnerabilities
- Direct browser API usage

### 5. Socket.io for Real-Time Updates

**Why**: Maintain persistent connection for live dashboard.

**Benefits**:

- Automatic fallback to polling
- Handles disconnection gracefully
- Efficient two-way communication
- Easy integration with React

## 📊 Database Schema

## ❓ Frequently Asked Questions (FAQs)

### Q: What information is collected when users read articles?

**A:** The system collects the article URL, domain, title, content, timestamps of when the reading session starts/ends, total reading time, and the tab's activity state.

### Q: How does the system handle multiple simultaneous tabs from the same user?

**A:** Each tab generates a unique session ID on load. Active reading time is only incremented for tabs where `document.visibilityState === 'visible'`.

### Q: What happens if the user loses internet connectivity while reading?

**A:** The Chrome extension stores failed events in `chrome.storage.local`. Once the connection is restored, pending events are sent automatically.

### Q: How does the system determine when the user is actively reading?

**A:** It uses `PAGE_ACTIVE` and `PAGE_INACTIVE` events. If no interaction is detected for 30 seconds on an active tab, reading time is paused.

### Q: What if the HTML structure of a tracked website changes?

**A:** The extension uses a fallback mechanism with predefined site-specific selectors, followed by general selectors like `<article>` or `<p>` tags for content extraction.

**Articles**:

- Stores unique articles (URL is unique key)
- Tracks AI-generated summaries and categories
- Linked to multiple reading sessions

**Sessions**:

- Represents one reading session
- Calculated `total_active_time` (sum of active periods)
- References parent article

**Events**:

- Individual user interactions
- Enables timeline reconstruction
- Timestamps all user actions

## 🔒 Security Considerations

1. **CORS**: Backend allows localhost for development
2. **Validation**: All inputs validated with Zod
3. **Error Handling**: Sensitive data not exposed in error responses
4. **Database**: Uses parameterized queries (Prisma ORM)
5. **Extension**: Only accesses whitelisted domains

## ⚠️ Limitations & Future Work

### Current Limitations

1. **No authentication**: Multi-user support not yet implemented
2. **No cron jobs**: Automatic session cleanup not yet scheduled
3. **Limited domains**: Only 3 Vietnamese news sites supported
4. **No data export**: Can't export reading data yet
5. **No charts**: Dashboard lacks visual analytics (Recharts installed but not used)

### Planned Features (Phase 2)

- [ ] User authentication and multi-user support
- [ ] Google Generative AI for article summarization
- [ ] Automatic article categorization
- [ ] Reading time prediction model
- [ ] User preference analytics
- [ ] Advanced charts and visualizations
- [ ] Data export (CSV, PDF)
- [ ] Browser history analysis
- [ ] Weekly/monthly reports
- [ ] Customizable news sources

### Performance Optimizations

- [ ] Database indexing on frequently queried columns
- [ ] Redis caching for popular articles
- [ ] Event batching on extension side
- [ ] Pagination for large datasets
- [ ] Image optimization in dashboard

## 🐛 Known Issues

1. **React imports**: ESLint flags unused React import (standard in modern React)
2. **Offline queue**: Limited to browser storage capacity (~5MB)
3. **Extension reload**: Manual reload needed after manifest changes
4. **CORS**: Development-only open CORS configuration

## 📝 Development Notes

### Adding a New Domain

1. Update `extension/manifest.json` host permissions
2. Add new CSS selector to `extension/config.js`
3. Update `extractArticleContent()` in `extension/content.js`
4. Test on the target website

### Debugging

- **Extension**: Check `chrome://extensions` → Details → Errors
- **Content script**: Inspect element on the news page, Console tab
- **Server**: Check terminal output and database logs
- **Dashboard**: React DevTools browser extension

### Testing

```bash
# Backend tests (none yet - TODO)
cd server
npm test

# Frontend tests (none yet - TODO)
cd client
npm test
```

## 📄 License

This project is for educational and testing purposes.

## 👥 Contributing

This is a test project for the DiiD internship program.

---

**Last Updated**: 2026-08-18

**Project Status**: MVP Complete (Phase I) ✅
