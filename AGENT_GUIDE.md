# AGENT_GUIDE.md - DiiD Internship Project Operational Framework

## Overview

This guide establishes the operational rules, technical architecture, and working principles for the DiiD Reading Activity Tracker system - a full-stack solution for tracking, storing, and analyzing user reading behavior on Vietnamese news websites.

---

## 1. Tech Stack Overview

### Client-Side

- **Framework**: React 18 (Vite) for fast development and HMR
- **Styling**: Tailwind CSS for utility-first responsive design
- **UI Components**: Lucide React for consistent iconography
- **Charts**: Recharts for real-time data visualization
- **Real-time**: Socket.io-client for WebSocket communication
- **HTTP Client**: Axios for API requests

### Server-Side

- **Runtime**: Node.js with ES Modules (ESM)
- **Framework**: Express.js for HTTP API routing
- **ORM**: Prisma v5 for type-safe database access
- **Database**: MySQL (hosted on Railway)
- **Real-time**: Socket.io for push notifications
- **AI Integration**: Google Generative AI SDK (`@google/genai`) with Gemini 2.5 Flash model
- **Validation**: Zod for runtime schema validation
- **Task Scheduling**: Node.js built-in timers + optional node-cron

### Chrome Extension

- **Manifest**: Manifest V3 (latest Chrome Extension standard)
- **Language**: Vanilla JavaScript (no build step required)
- **Storage**: Chrome Storage API (chrome.storage.local)
- **Content Injection**: Content scripts on target news domains
- **Communication**: Fetch API with sendBeacon for reliability

---

## 2. Architecture Pattern

### Server-Side Layered Architecture (Strict MVC)

```
Request Flow:
HTTP Request
  ↓
routes/*.routes.js (Route Definition)
  ↓
controllers/*.controller.js (Request Validation, Response Formatting)
  ↓
services/*.service.js (Business Logic, Data Processing)
  ↓
prisma.client (Database Query Execution)
  ↓
MySQL Database
```

**Why This Pattern?**

### Task Update Automation - Phase 2:

- Task: `GET /api/stats` added
- Cron auto-close session after 5 mins (node-cron)
- Layered updates done (controller/routes delegations)
- Next Roll w/instate-wide.

### Directory Structure

```
server/
├── src/
│   ├── config/
│   │   ├── prisma.js (Database client)
│   │   ├── socket.js (Socket.io setup)
│   │   └── gemini.js (AI client initialization)
│   ├── routes/
│   │   ├── event.routes.js
│   │   ├── session.routes.js
│   │   ├── article.routes.js
│   │   ├── ai.routes.js (AI prediction endpoints)
│   │   └── stats.routes.js (Analytics endpoints)
│   ├── controllers/
│   │   ├── event.controller.js
│   │   ├── session.controller.js
│   │   ├── article.controller.js
│   │   ├── ai.controller.js
│   │   └── stats.controller.js
│   ├── services/
│   │   ├── event.service.js (Event processing, deduplication)
│   │   ├── session.service.js (Session management)
│   │   ├── article.service.js (Article CRUD)
│   │   ├── ai.service.js (Gemini API integration)
│   │   └── stats.service.js (Analytics calculation)
│   ├── middlewares/
│   │   ├── validate.middleware.js (Zod validation)
│   │   └── error.middleware.js (Global error handling)
│   ├── cron/
│   │   └── cleanup.cron.js (Auto-close stale sessions)
│   └── index.js (Express server initialization)
├── prisma/
│   ├── schema.prisma (Database schema)
│   └── migrations/ (Database version control)
└── package.json
```

---

## 3. Workflow Execution Rules (One-Task-at-a-Time)

### Core Principle

- **Execute exactly ONE task at a time** from `task.md`
- **No task parallelization** to prevent context window overflow and hallucination
- **Sequential completion** ensures stable, tested increments

### Workflow Steps

1. **Read `task.md`** - Identify first incomplete task (`- [ ]`)
2. **Understand Requirements** - Read PDF specs and related documentation
3. **Implement Solution** - Write clean, production-ready code
4. **Test Thoroughly** - Verify functionality works as specified
5. **Update `task.md`** - Mark task complete (`- [x]`) with timestamp
6. **Move to Next Task** - Only proceed after previous task confirmed working

### Task Marking Convention

```markdown
- [ ] Incomplete task (not yet started)
- [x] Completed task ✓ (tested and working)
```

### Code Quality Standards

- **Layered Architecture**: Always follow Route → Controller → Service → Prisma
- **Error Handling**: Try-catch blocks with meaningful error messages
- **Input Validation**: Zod schemas for all API inputs
- **Naming Convention**: camelCase for variables/functions, UPPER_SNAKE_CASE for constants
- **ES Modules**: Use `import/export` syntax consistently
- **Comments**: Document complex logic but keep code self-explanatory

---

## 4. Key Technical Decisions

### Event-Based Storage (Not Aggregate)

- **Why**: Enables detailed timeline analysis and edge case handling
- **Benefit**: Can retroactively calculate active time with different algorithms
- **Impact**: Requires efficient querying with indexes on session_id and timestamp

### Idempotency via Event Deduplication

- **Implementation**: UUID-based event IDs with recent event dedup check
- **Duration**: Check last 5 seconds for duplicate (PAGE_ENTER, PAGE_LEAVE)
- **Fallback**: Store event then prevent duplicate database inserts

### Active Reading Time Calculation

- **Method**: Event-based state transitions (not simple time delta)
- **Logic**:
  - PAGE_ENTER → session starts
  - PAGE_ACTIVE → user interactive (accumulates time)
  - PAGE_INACTIVE → idle for 30+ seconds (stops accumulation)
  - PAGE_LEAVE → session ends
- **Tracking**: Maintain throttled event listeners (1s delay) to reduce noise

### AI Integration (Gemini 2.5 Flash)

- **Status Update**: Summarization and classification features have been implemented, but require further integration into the real-time event processing flow.
- **Future Enhancements**: The inclusion of reading time prediction models remains a high-priority addition for Phase II development.

- **Choice**: Google Generative AI API (cost-effective, no training required)
- **Features**: Summarization, classification, preference analysis, time prediction
- **Integration**: Async service with error handling and fallback
- **Cache**: Optional: Store summaries/classifications to reduce API calls

### Offline Queue Mechanism

- **Storage**: Chrome Storage API (not localStorage for persistence)
- **Trigger**: Failed fetch or network offline event
- **Retry**: Automatic flush when online, manual retry per event
- **Cleanup**: Remove from queue only after successful server receipt

---

## 5. Real-Time Communication (Socket.io)

### Events to Broadcast

- `tracking_update`: New event received (for dashboard refresh)
- `session_complete`: User finished reading session
- `article_analyzed`: AI summary/classification ready

### Frontend Listening Pattern

```javascript
socket.on("tracking_update", () => {
  // Refetch data from API
  // Update React state
  // Re-render affected components
});
```

---

## 6. Database Model Relationships

### Article Model

- 1 Article : Many Sessions (1 user can read same article multiple times)
- 1 Article : Many Events (via Sessions)
- Fields: URL (unique), domain, title, content, created_at
- AI Fields (Phase II): summary, category, confidence_score

### Session Model

- 1 Session : 1 Article (but same article can have multiple sessions)
- 1 Session : Many Events (ENTER, ACTIVE, INACTIVE, LEAVE sequence)
- Fields: session_id (UUID), start_time, end_time, total_active_time, status (ACTIVE/COMPLETED)

### Event Model

- Fields: event_id (UUID), session_id, event_type, timestamp, metadata (JSON)
- event_type: PAGE_ENTER | PAGE_ACTIVE | PAGE_INACTIVE | PAGE_LEAVE

---

## 7. Error Handling Strategy

### HTTP Response Codes

- `200/201`: Success (GET returns 200, POST creates 201)
- `400`: Bad request (validation failed)
- `404`: Resource not found
- `500`: Server error (database, AI API failure)

### Validation Layers

1. **Zod Schema** (in controller) - Type and format validation
2. **Service Logic** - Business rule validation (e.g., duplicate check)
3. **Database Constraints** - Unique keys, foreign keys

### Graceful Degradation

- AI service fails? → Store article without summary/category, retry later
- Network offline? → Queue event, send when connection restored
- Database connection loss? → Middleware catches, returns 500

---

## 8. Performance Considerations

### Database Indexes

- Index on `session_id` (Event table) - frequent queries
- Index on `created_at` (Article, Session tables) - timeline queries
- Compound index on `(session_id, timestamp)` for efficient range queries

### Pagination

- Default limit: 10 records per page
- Support query params: `?page=1&limit=10`
- Return pagination metadata: `{ page, limit, total, totalPages }`

### Real-Time Throttling

- Extension: 1-second throttle on activity tracking (reduce event spam)
- Socket.io: Batch updates if multiple events in quick succession

### Cron Job for Cleanup

- Run every 5 minutes
- Close sessions older than 5 minutes without PAGE_LEAVE event
- Mark as COMPLETED with last_event_timestamp as end_time

---

## 9. Security Considerations

### CORS Configuration

- Allow frontend origin (localhost:5173) in development
- Production: Whitelist specific domains only

### Input Sanitization

- Zod validation prevents injection attacks
- Parameterized Prisma queries prevent SQL injection
- No direct string interpolation in queries

### Chrome Extension Permissions

- Request only necessary permissions in manifest.json
- Explain permission usage in popup UI
- Validate recipient domain before sending events

---

## 10. Testing & Debugging

### Manual API Testing

```bash
# Test event submission
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{...event payload...}'

# Test data retrieval
curl http://localhost:5000/api/articles
curl http://localhost:5000/api/sessions
```

### Extension Console Logging

- Prefix all logs with `[DiiD-Tracker]` for easy filtering
- Log events before/after network requests
- Include response status and data in debug output

### Server Debug Mode

- Set `DEBUG=prisma:*` to see all database queries
- Enable HTTP request logging middleware
- Monitor Socket.io connection events

---

## 11. Deployment Checklist (Future)

- **Update**: Refer to the new "Examples & Results" and "Real-World Scenarios" sections in the `README.md` for visual outputs and detailed breakdowns of system behavior under various edge cases.

- [ ] Set environment variables (DATABASE_URL, GOOGLE_API_KEY, etc.)
- [ ] Run Prisma migrations
- [ ] Build React app for production
- [ ] Package extension for Chrome Web Store
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up monitoring and error tracking (Sentry)

---

## 12. References

- [PDF Spec](./d:/PDF/Intership_test_DiiD.pdf) - Complete requirements document
- [README.md](./README.md) - Architecture overview and edge case solutions
- [task.md](./task.md) - Detailed task checklist with progress tracking
