# Extension Debugging Guide

## How to Test and Debug the Chrome Extension

### Step 1: Reload Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Find "Reading Activity Tracker"
3. Click the **Reload** button (circular arrow icon)
4. Verify it shows "ON" status

### Step 2: Open DevTools on News Website

1. Visit one of these sites:
   - https://vnexpress.net (pick any article)
   - https://dantri.com.vn (pick any article)
   - https://tuoitre.vn (pick any article)

2. Open DevTools: Press **F12**

3. Go to **Console** tab

4. Look for messages starting with `[DiiD-Tracker]` - these should appear immediately

**Expected Console Output**:

```
[DiiD-Tracker] Content script starting initialization...
[DiiD-Tracker] Document ready state: interactive (or complete)
[DiiD-Tracker] Content script loaded on page https://...
[DiiD-Tracker] Session initialized [UUID]
[DiiD-Tracker] Sending PAGE_ENTER event...
[DiiD-Tracker] Sending event to API PAGE_ENTER
[DiiD-Tracker] API URL: http://localhost:5000/api/events
[DiiD-Tracker] Response status: 201
[DiiD-Tracker] Event sent successfully: PAGE_ENTER
[DiiD-Tracker] Server response: {success: true, data: {...}}
[DiiD-Tracker] Event listeners setup complete
```

### Step 3: Monitor Network Requests

1. In DevTools, go to **Network** tab
2. Reload the page
3. Look for a POST request to `localhost:5000/api/events`
4. Click on it and check:
   - **Status**: Should be 201
   - **Request Body**: Should contain event data
   - **Response**: Should contain `{success: true, data: {...}}`

### Step 4: Check Server Terminal

Look at your server terminal (where `npm run dev` is running) for:

```
POST /api/events 201
```

And Prisma should show INSERT queries like:

```
prisma:query INSERT INTO `DiiD`.`articles` ...
prisma:query INSERT INTO `DiiD`.`sessions` ...
prisma:query INSERT INTO `DiiD`.`events` ...
```

## Troubleshooting

### Issue 1: No `[DiiD-Tracker]` Messages in Console

**Problem**: Extension is not running on the page

**Solutions**:

1. Check manifest.json permissions:

   ```json
   "host_permissions": [
     "*://vnexpress.net/*",
     "*://dantri.com.vn/*",
     "*://tuoitre.vn/*"
   ]
   ```

2. Reload extension (chrome://extensions/ > Reload button)

3. Check extension version:
   - Go to chrome://extensions/
   - Verify "Reading Activity Tracker" shows version 1.0

4. Try incognito mode:
   - Extensions might be disabled in incognito
   - Go to chrome://extensions/ > Details > Allow in Incognito

### Issue 2: `[DiiD-Tracker] Response status: 0` or Network Error

**Problem**: Cannot reach API server

**Solutions**:

1. Verify server is running:

   ```bash
   curl http://localhost:5000/
   # Should respond: "Server is running..."
   ```

2. Check API URL in extension/content.js:

   ```javascript
   const API_URL = "http://localhost:5000/api/events";
   ```

3. Try accessing from browser console:
   ```javascript
   fetch("http://localhost:5000/api/events", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ event_type: "TEST" }),
   })
     .then((r) => r.json())
     .then(console.log);
   ```

### Issue 3: Response Status 400 (Bad Request)

**Problem**: Event validation failed

**Check console for error message**. Common issues:

- Missing required fields
- Invalid event_type

### Issue 4: Response Status 500 (Server Error)

**Problem**: Server crashed or database error

**Check server terminal for error stack trace**

## Manual Testing via Console

Open DevTools console on a news article page and run:

```javascript
// Manually trigger PAGE_ENTER
fetch("http://localhost:5000/api/events", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event_type: "PAGE_ENTER",
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    content: "Test content",
    session_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log("Response:", data);
    if (data.success) console.log("✓ Event created successfully!");
  });
```

## Checking Chrome Extension Storage

1. Open DevTools on any page
2. Go to **Application** tab
3. Left sidebar > **Storage** > **Local Storage**
4. Look for extension-specific storage entries

## Verify Database Integration

After sending events, check database:

```bash
# In server terminal, look for queries like:
prisma:query INSERT INTO `DiiD`.`articles` (`url`, `domain`, `title`, `content`, `created_at`) VALUES (?, ?, ?, ?, ?)
prisma:query INSERT INTO `DiiD`.`sessions` (`id`, `article_id`, `start_time`, `created_at`, `updated_at`, `status`) VALUES (?, ?, ?, ?, ?, ?)
prisma:query INSERT INTO `DiiD`.`events` (`id`, `session_id`, `event_type`, `timestamp`) VALUES (?, ?, ?, ?)
```

## Content Extraction Debugging

The extension tries multiple selectors to extract article content:

1. **VnExpress**: `article.fck_detail`
2. **Dân Trí**: `.dt-news-content`
3. **Tuổi Trẻ**: `.detail-content-body`
4. **Generic**: `article` tag
5. **Fallback**: All `<p>` tags

Check console for which selector matched:

```
[DiiD-Tracker] Content extracted from VnExpress selector ...
```

If extraction fails, inspect the page HTML and update selectors in `extension/content.js`.

## Complete Debug Checklist

- [x] Extension appears in chrome://extensions/
- [x] Extension shows "ON" status
- [ ] Extension reloaded after manifest changes
- [ ] DevTools console shows `[DiiD-Tracker]` messages
- [ ] Network tab shows POST to localhost:5000
- [ ] Response status is 201
- [ ] Server terminal shows INSERT queries
- [x] Dashboard at localhost:5173 shows new data
- [x] Database has new articles/sessions/events
