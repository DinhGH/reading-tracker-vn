# Project Tasks - DiiD Reading Activity Tracker (Detailed)

## 1. Chrome Extension Development

- [x] Analyze Chrome Extension Manifest V3 structure
- [x] Setup background service worker for event management
- [x] Develop content script for domain-specific data extraction
- [x] Implement fallback CSS selectors for VnExpress, Dân Trí, Tuổi Trẻ
- [x] Create event listener for user interactions (scroll, mousemove, click)
- [x] Develop inactivity detection logic (30s threshold)
- [x] Implement throttling for activity events (1s delay)
- [x] Develop beacon-based event transmission on tab close/unload
- [x] Implement local storage queue for offline event management
- [x] Develop logic to flush offline queue on reconnection
- [x] Create popup UI for extension status display
- [x] Implement communication logic between content script and background script

## 2. Backend Server Development

- [x] Scaffold Express.js server with ES modules
- [x] Define Prisma schema for Article, Session, and Event models
- [x] Implement database connection and Prisma client config
- [x] Create API route structure: events, sessions, articles, stats
- [x] Develop `event.service.js` with deduplication logic
- [x] Implement input validation using Zod
- [x] Develop real-time socket.io event broadcast mechanism
- [x] Create database cleanup cron job for stale sessions
- [x] Implement global error handling middleware
- [x] Setup environment configuration (dotenv)

## 3. Frontend Dashboard

- [x] Scaffold React project with Vite & Tailwind CSS
- [x] Design dashboard UI layout with responsive components
- [x] Implement Metric Cards for real-time reading data
- [x] Develop Articles table with sorting and filtering
- [x] Develop Sessions table with event timeline view
- [x] Integrate socket.io client for real-time dashboard updates
- [x] Connect API services (Axios) for data fetching
- [x] Implement loading states and error notifications

## 4. AI Engineering Implementation

- [x] Setup Google Generative AI integration (`@google/genai`)
- [x] Create `AIService` for article summarization (3-5 sentences)
- [x] Create `AIService` for article categorization (Topic detection)
- [x] Implement input sanitization for AI processing
- [x] Develop result parsing and validation logic
- [x] Integrate AI output caching mechanism to optimize costs

## 5. Documentation & Verification

- [x] Document system architecture (ASCII diagram)
- [x] Draft `README.md` with comprehensive setup instructions
- [x] Create "Real-World Scenarios" documentation for edge cases
- [x] Develop `PROJECT_VERIFICATION_REPORT.md`
- [x] Create `TESTING_GUIDE.md` with API and manual test steps
- [x] Write `AGENT_GUIDE.md` for project operational standards
- [x] Organize `QUESTION.md` with technical answers for test questions
- [x] Review all markdown files for consistency and completeness
