# Testing & Troubleshooting Guide - Reading Activity Tracker

## Quick Start Verification

### 1. Verify Server is Running

```bash
# Check if server is accessible
curl http://localhost:5000/
# Expected response: "Server is running..."
```

### 2. Verify Frontend is Running

Open `http://localhost:5173` in your browser. You should see the Reading Activity Tracker dashboard.

### 3. Verify Extension is Loaded

1. Open Chrome and go to `chrome://extensions/`
2. Toggle "Developer mode" ON (top-right corner)
3. Verify "Reading Activity Tracker" appears in the list
4. Check that it shows "ON" status

## Testing the System End-to-End

### Step 1: Reload Extension in Chrome

1. Go to `chrome://extensions/`
2. Find "Reading Activity Tracker"
3. Click the refresh icon to reload the extension

### Step 2: Visit a News Website

Visit one of the configured news sites:

- https://vnexpress.net (Pick any article)
- https://dantri.com.vn (Pick any article)
- https://tuoitre.vn (Pick any article)

### Step 3: Monitor Console Output

1. **Check Extension Console**:
   - Right-click on the extension icon
   - Select "Inspect popup"
   - Go to Console tab
   - You should see:
     ```
     Session initialized: [UUID]
     Event sent successfully: PAGE_ENTER
     ```

2. **Check Server Terminal**:
   - Look for `POST /api/events` in server logs
   - You should see the event being processed

3. **Check Browser Console** (on the news page):
   - Open DevTools (F12)
   - Go to Console tab
   - You should see logging from content script

### Step 4: View Data in Dashboard

1. Go to `http://localhost:5173`
2. You should see:
   - Metric cards with data
   - Articles table populated with articles you visited
   - Sessions table with reading sessions

## Troubleshooting Guide

### Problem 1: Extension Not Sending Events

**Symptoms**: Dashboard is empty, no events in server logs

**Solution**:

1. Check extension is loaded:

   ```
   chrome://extensions/ → Check "Reading Activity Tracker" shows "ON"
   ```

2. Check manifest permissions:
   - Open `extension/manifest.json`
   - Verify host_permissions include the website you're visiting
   - Reload extension after any manifest changes

3. Check content script is injected:
   - Open DevTools on the news page (F12)
   - Go to Console
   - Type: `console.log(sessionId)`
   - If undefined, content script didn't load

4. Verify API endpoint is correct:
   - In `extension/content.js` line 2
   - Should be: `const API_URL = "http://localhost:5000/api/events";`

### Problem 2: 500 Error from Server

**Symptoms**: "Error fetching data: AxiosError: Request failed with status code 500"

**Solution**:

1. Check server logs for error details
2. Verify database is connected:

   ```bash
   # In server terminal, look for:
   # "Database connected successfully"
   ```

3. Regenerate Prisma client:

   ```bash
   cd server
   npx prisma generate
   ```

4. Check schema matches database:
   ```bash
   npx prisma db push
   ```

### Problem 3: Content Not Being Extracted

**Symptoms**: Articles appear in dashboard but content is empty

**Solution**:

1. The content extraction might not be working for that specific website
2. Check the CSS selectors in `extension/content.js` lines 40-71
3. Inspect the website's HTML structure:
   - Right-click article → Inspect
   - Find the article container element
   - Update selector in `extractArticleContent()` function

### Problem 4: Events Not Appearing in Real-Time

**Symptoms**: Data appears after refresh but not in real-time

**Solution**:

1. Socket.io connection might be down
2. Open dashboard DevTools Console
3. Check for Socket.io connection messages
4. Verify `localhost:5000` is accessible from client

### Problem 5: CORS Errors

**Symptoms**: "Access to XMLHttpRequest at 'http://localhost:5000/api/events' has been blocked by CORS policy"

**Solution**:

1. Server has CORS enabled, but check if it's working
2. Verify `server/src/index.js` has `app.use(cors());`
3. If still failing, add explicit CORS configuration:
   ```javascript
   app.use(
     cors({
       origin: ["http://localhost:5000", "http://localhost:5173"],
       credentials: true,
     }),
   );
   ```

## Manual Testing via API

### Test 1: Send Event Directly

```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "PAGE_ENTER",
    "url": "https://vnexpress.net/test",
    "title": "Test Article",
    "domain": "vnexpress.net",
    "content": "This is test content for the article.",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-08-18T20:53:00.000Z"
  }'
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "[event-uuid]",
    "event_type": "PAGE_ENTER",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-08-18T20:53:00.000Z"
  }
}
```

### Test 2: Retrieve Articles

```bash
curl http://localhost:5000/api/articles
```

**Expected Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "https://vnexpress.net/test",
      "domain": "vnexpress.net",
      "title": "Test Article",
      "content": "This is test content...",
      "created_at": "2026-08-18T20:53:00.000Z",
      "read_count": 1,
      "total_read_time": 0
    }
  ]
}
```

### Test 3: Retrieve Sessions

```bash
curl "http://localhost:5000/api/sessions?page=1&limit=10"
```

**Expected Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "article_id": 1,
      "start_time": "2026-08-18T20:53:00.000Z",
      "end_time": null,
      "total_active_time": 0,
      "status": "ACTIVE",
      "created_at": "2026-08-18T20:53:00.000Z",
      "updated_at": "2026-08-18T20:53:00.000Z",
      "article": {
        "id": 1,
        "url": "https://vnexpress.net/test",
        "domain": "vnexpress.net",
        "title": "Test Article",
        "content": "This is test content...",
        "created_at": "2026-08-18T20:53:00.000Z"
      },
      "events": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Browser DevTools Debugging

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Visit a news article
4. Look for POST request to `localhost:5000/api/events`
5. Click on it and check:
   - Status code should be 201
   - Request body contains correct event data
   - Response contains success flag

### Check Console Logs

1. Open DevTools Console
2. Look for messages from content script:

   ```
   Session initialized: [UUID]
   Event sent successfully: PAGE_ENTER
   Event sent successfully: PAGE_ACTIVE
   ```

3. Check for errors (red messages)

### Check Local Storage / Chrome Storage

1. Open DevTools
2. Go to Application tab
3. Check:
   - **Local Storage**: (if using localStorage - deprecated)
   - **Chrome Storage**: Extensions > Reading Activity Tracker > Pending Events

## Performance Monitoring

### Monitor Server Performance

```bash
# In server terminal, check for:
# - Prisma connection pool status
# - Event processing time
# - Database query performance
```

### Monitor Extension Performance

1. Open `chrome://extensions/`
2. Click "Details" on Reading Activity Tracker
3. Check:
   - Extension icon load time
   - Background service worker status
   - Content script memory usage

## Common Configuration Issues

### Issue: Extension Not Working on HTTPS Sites

**Fix**: Update `manifest.json` host_permissions:

```json
"host_permissions": [
  "https://vnexpress.net/*",
  "https://dantri.com.vn/*",
  "https://tuoitre.vn/*"
]
```

### Issue: Server Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Fix**:

```bash
# Find and kill process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 [PID]  # macOS/Linux
taskkill /PID [PID] /F  # Windows
```

### Issue: Database Connection Fails

**Error**: `Failed to connect to the database`

**Fix**:

1. Verify `.env` file has correct `DATABASE_URL`
2. Test database connection:
   ```bash
   cd server
   npx prisma db push
   ```
3. Check MySQL server is running

## Reset & Clean Start

If everything is broken, do a clean reset:

```bash
# Kill all node processes
taskkill /F /IM node.exe  # Windows
killall node  # macOS/Linux

# Clear Prisma cache
cd server
rm -rf node_modules/.prisma
npx prisma generate

# Reload extension
chrome://extensions/  # Reload the extension

# Start services again
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

## Performance Optimization Tips

1. **Reduce Event Frequency**: Adjust `THROTTLE_DELAY` in `extension/content.js`
2. **Database Indexing**: Add indexes for frequently queried columns
3. **Pagination**: Use pagination for large datasets in dashboard
4. **Caching**: Implement Redis for API responses

## Testing Checklist

- [x] Server starts without errors
- [x] Frontend loads at `http://localhost:5173`
- [x] Extension appears in `chrome://extensions/`
- [x] Can visit news site without errors
- [ ] Console shows "Session initialized" message
- [ ] Server logs show POST /api/events request
- [ ] Dashboard refreshes and shows data
- [ ] Articles table has at least one entry
- [ ] Sessions table has at least one entry
- [ ] Metric cards show read count > 0
- [ ] Manual API test returns correct data
- [x] No CORS errors in browser console
- [x] No 500 errors from server

---

**Last Updated**: 2026-08-18
