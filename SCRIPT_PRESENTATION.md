// Demo Presentation Script for Reading Activity Tracker

# Introduction

Welcome to the demo of the Reading Activity Tracker! This system is designed to monitor and analyze user reading habits on news websites through an integrated full-stack solution.

# Key Points of the Project

1. Chrome Extension for data collection
2. Backend server for event processing
3. Real-time dashboard for data visualization
4. AI-powered summarization and categorization features

# Demo Agenda

1. Introduction and Goals
2. System Architecture Overview
3. Live Demonstration
   - Setup Steps
   - Chrome Extension in Action
   - Backend API Overview
   - Rich Dashboard Features
4. Edge Case Handling
5. Key Achievements and Future Plans

---

## 1. Introduction and Goals

- Emphasize the system's ability to improve user engagement tracking for news content.
- Goal: Deploy a seamless tracker system that is non-intrusive and precise.

## 2. System Architecture and Technical Decision Highlights

- Showcase three-tier architecture: Chrome Extension, Backend, Frontend.
- Discuss technical decisions like the use of Event-Based Architecture and Socket.io for real-time updates.

---

## 3. Live Demonstration

### Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/DinhGH/reading-tracker-vn.git
   cd server && npm install
   cd ../client && npm install
   ```

2. Configure the environment variables:
   - For Prisma database connection: Adjust `DATABASE_URL`.
   - Add the Google Generative AI API key under `GEMINI_API_KEY` in the backend `.env`.

3. Initialize Database:

   ```bash
   npm run migrate
   ```

4. Run the backend, frontend, and set up the Chrome extension as instructed in the `README.md`.

---

### Chrome Extension:

- Demonstrate real-time data collection from supported websites.
- Example websites: VnExpress, Tuoi Tre, and DanTri.
- Explain how the extension tracks `PAGE_ACTIVE` and `PAGE_INACTIVE` events.

### Backend Highlights:

- Introduce REST API endpoints (`/api/events`, `/api/articles`, `/api/sessions`).
- Explain critical validations, deduplication, and real-time data flow.

### Dashboard Features:

- Showcase real-time updates with metric cards for user sessions and total read time.
- Navigate article lists, summaries, and classification details.
- Zoom into visual timelines for user activity.

---

## 4. Edge Cases

- Discuss solutions to handle internet drop-offs, multiple tabs, and webpage layout changes.

## 5. Conclusion:

- Key achievements: MVP Stage Complete.
- Future plans include enhanced AI features, better analytics, and user authentication.

---

# Closing Note

Thank you for reviewing this demo. The Reading Activity Tracker is a robust, scalable solution for real-time user engagement tracking. I look forward to your feedback on our implementation!
