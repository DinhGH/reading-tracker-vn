// Content Script for Reading Activity Tracker Extension
// Tracks user reading behavior on news websites

// ===--- Moving config.js content here due to ES module compatibility issues ---===
const TRACKED_WEBSITES = [
  {
    domain: "vnexpress.net",
    name: "VnExpress",
    selectors: [".container", ".detail-new"],
  },
  {
    domain: "dantri.com.vn",
    name: "Dân Trí",
    selectors: ["#articleContent"],
  },
  {
    domain: "tuoitre.vn",
    name: "Tuổi Trẻ",
    selectors: [".main-detail", "#detail__cmain"],
  },
];

const EVENT_TYPES = {
  PAGE_ENTER: "PAGE_ENTER",
  PAGE_ACTIVE: "PAGE_ACTIVE",
  PAGE_INACTIVE: "PAGE_INACTIVE",
  PAGE_LEAVE: "PAGE_LEAVE",
};

const TRACKING_CONFIG = {
  API_URL: "http://localhost:5000/api/events",
  INACTIVITY_TIMEOUT: 30000, // 30 seconds
  THROTTLE_DELAY: 1000, // 1 second
};

// State management
let sessionId = null;
let sessionStarted = false;
let lastActivityTime = Date.now();
let inactivityTimer = null;
let isPageActive = true;
let pendingEvents = [];
let pageLeftSent = false;
let isClosing = false; // Flag to prevent multiple events during unload
let pageWasHidden = false; // Track if page was hidden before

// Debug logging
function debug(message, data) {
  console.log(`[DiiD-Tracker] ${message}`, data || "");
}

// Get website config for current domain
function getWebsiteConfig() {
  const domain = window.location.hostname;
  return TRACKED_WEBSITES.find((site) => domain.includes(site.domain));
}

// Extract article content from page
function extractArticleContent() {
  try {
    const config = getWebsiteConfig();
    if (!config) {
      debug("Website not configured for tracking");
      return "";
    }

    // Try configured selectors
    for (const selector of config.selectors) {
      const article = document.querySelector(selector);
      if (article) {
        const content = article.innerText || article.textContent;
        debug(
          `Content extracted from ${config.name} (${selector})`,
          content.substring(0, 50),
        );
        return content;
      }
    }

    // Fallback: generic article tag
    const article = document.querySelector("article");
    if (article) {
      const content = article.innerText || article.textContent;
      debug(
        "Content extracted from generic article tag",
        content.substring(0, 50),
      );
      return content;
    }

    // Last resort: get paragraphs
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .map((p) => p.textContent)
      .join(" ");

    const content = paragraphs || document.body.innerText;
    debug(
      "Content extracted from paragraphs fallback",
      content.substring(0, 50),
    );
    return content;
  } catch (error) {
    console.error("[DiiD-Tracker] Error extracting content:", error);
    return "";
  }
}

// Throttle helper function
function throttle(func, delay) {
  let lastCall = 0;
  return function () {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func();
    }
  };
}

/**
 * Detect SPA URL changes and article content changes
 * When navigating between articles on same site:
 * - Send PAGE_INACTIVE to close active period of old session
 * - Send PAGE_SWITCH to mark article navigation (close previous session)
 * - Create NEW session_id for new article (treat as new session)
 * - Send PAGE_ENTER + PAGE_ACTIVE for new article with new session
 */
let lastHref = window.location.href;
let lastArticleTitle = document.title;
let navigationCheckInterval = null;
let navigationCheckCount = 0;

function handleNavigation() {
  navigationCheckCount++;
  const currentHref = window.location.href;
  const currentTitle = document.title;
  const urlChanged = currentHref !== lastHref;
  const titleChanged = currentTitle !== lastArticleTitle;

  // Log URL checks every 5 seconds (500ms * 10) for debugging
  if (navigationCheckCount % 10 === 0) {
    debug("URL check (every 5s):", {
      lastHref: lastHref.substring(0, 50),
      currentHref: currentHref.substring(0, 50),
      urlChanged,
      sessionStarted,
      isPageActive,
    });
  }

  if (urlChanged || titleChanged) {
    debug("⚠️ NAVIGATION DETECTED!", {
      urlChanged,
      titleChanged,
      from: lastHref,
      to: currentHref,
      fromTitle: lastArticleTitle,
      toTitle: currentTitle,
      sessionStarted,
      isPageActive,
    });

    if (sessionStarted && isPageActive) {
      // Send PAGE_INACTIVE first (with a timestamp)
      const inactiveTime = new Date().toISOString();
      sendEvent({
        event_type: EVENT_TYPES.PAGE_INACTIVE,
        session_id: sessionId,
        url: lastHref,
        title: lastArticleTitle,
        domain: window.location.hostname,
        timestamp: inactiveTime,
      });
      debug("PAGE_INACTIVE sent before PAGE_LEAVE (navigation)");
      isPageActive = false;

      // Small delay to ensure proper event ordering
      setTimeout(() => {
        // Send PAGE_LEAVE for the current article
        const leaveTime = new Date().toISOString();
        sendEventWithBeacon({
          event_type: EVENT_TYPES.PAGE_LEAVE,
          session_id: sessionId,
          url: lastHref,
          title: lastArticleTitle,
          domain: window.location.hostname,
          timestamp: leaveTime,
        });
        debug("PAGE_LEAVE sent for article navigation", {
          sessionId,
          leaveTime,
        });
      }, 100);

      // Delay before creating new session
      setTimeout(() => {
        lastHref = currentHref;
        lastArticleTitle = currentTitle;

        // Create NEW session
        sessionId = crypto.randomUUID();
        isPageActive = true;
        pageLeftSent = false;
        lastActivityTime = Date.now();

        debug("New session created", sessionId);

        // Send PAGE_ENTER
        const enterTime = new Date().toISOString();
        sendEvent({
          event_type: EVENT_TYPES.PAGE_ENTER,
          session_id: sessionId,
          url: currentHref,
          title: currentTitle,
          domain: window.location.hostname,
          content: extractArticleContent(),
          timestamp: enterTime,
        });
        debug("PAGE_ENTER sent", { sessionId, enterTime });

        // Send PAGE_ACTIVE
        const activeTime = new Date().toISOString();
        sendEvent({
          event_type: EVENT_TYPES.PAGE_ACTIVE,
          session_id: sessionId,
          url: currentHref,
          title: currentTitle,
          domain: window.location.hostname,
          timestamp: activeTime,
        });
        debug("PAGE_ACTIVE sent", { sessionId, activeTime });
      }, 200);
    } else if (!sessionStarted) {
      lastHref = currentHref;
      lastArticleTitle = currentTitle;
    }
  }
}

function startNavigationMonitoring() {
  // Monitor URL changes every 500ms (for SPA navigation)
  navigationCheckInterval = setInterval(handleNavigation, 500);
  debug("URL change monitoring started (500ms interval)");
}

// Start monitoring URL changes
startNavigationMonitoring();

// Initialize session on page load or when returning to page
function initializeSession() {
  try {
    // Prevent re-initialization if session is already started
    if (sessionStarted && !pageLeftSent) {
      debug("Session already started, skipping re-initialization");
      return;
    }

    const config = getWebsiteConfig();
    if (!config) {
      debug("Website not in tracked list, skipping initialization");
      return;
    }

    debug("Content script loaded on page", window.location.href);

    const url = window.location.href;
    const title = document.title;
    const domain = window.location.hostname;
    const content = extractArticleContent();

    // Always create a NEW session ID (new session each time)
    sessionId = crypto.randomUUID();
    sessionStarted = true;
    isPageActive = true;
    pageLeftSent = false;
    pageWasHidden = false;
    lastActivityTime = Date.now();

    debug("New session initialized", sessionId);

    // Send PAGE_ENTER + PAGE_ACTIVE immediately
    debug("Sending PAGE_ENTER event...");
    sendEvent({
      event_type: EVENT_TYPES.PAGE_ENTER,
      url,
      title,
      domain,
      content,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    // Đảm bảo trạng thái là ACTIVE ngay lập tức sau khi Enter
    isPageActive = true;
    debug("Sending PAGE_ACTIVE event immediately after ENTER...");
    sendEvent({
      event_type: EVENT_TYPES.PAGE_ACTIVE,
      url,
      title,
      domain,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });

    // Chỉ sau khi ACTIVE thì mới setup inactivity timer
    setupEventListeners();
    debug("Event listeners setup complete");
  } catch (error) {
    console.error("[DiiD-Tracker] Error in initializeSession:", error);
  }
}

/**
 * Setup event listeners: hoạt động mới:
 * - inactivity timeout: 30s không hoạt động
 * - Không gửi PAGE_INACTIVE nếu liên tục có hoạt động
 * - Chỉ gửi PAGE_ACTIVE khi state trước đó IS NOT active
 * - Inactivity timer chỉ được bắt đầu SAU LẦN TƯƠNG TÁC ĐẦU TIÊN
 */
function setupEventListeners() {
  // Sử dụng duy nhất 1 biến timeout từ config
  const INACTIVITY_TIMEOUT = TRACKING_CONFIG.INACTIVITY_TIMEOUT;
  // Track user activity với throttle
  const recordActivity = throttle(() => {
    lastActivityTime = Date.now();

    // Nếu đang inactive → chuyển sang active
    if (!isPageActive) {
      isPageActive = true;
      sendEvent({
        event_type: EVENT_TYPES.PAGE_ACTIVE,
        session_id: sessionId,
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        timestamp: new Date().toISOString(),
      });
      debug("PAGE_ACTIVE sent - user resumed activity");
    }

    // Luôn reset/set lại inactivity timer khi có tương tác
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      if (isPageActive) {
        isPageActive = false;
        sendEvent({
          event_type: EVENT_TYPES.PAGE_INACTIVE,
          session_id: sessionId,
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
        });
        debug("PAGE_INACTIVE sent - user idle for inactive timeout");
      }
    }, INACTIVITY_TIMEOUT);
  }, TRACKING_CONFIG.THROTTLE_DELAY);

  // Listen to user interactions
  document.addEventListener("mousemove", recordActivity);
  document.addEventListener("scroll", recordActivity);
  document.addEventListener("keydown", recordActivity);
  document.addEventListener("click", recordActivity);

  // Handle visibility change (tab switching)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Tab is hidden
      if (isPageActive) {
        isPageActive = false;
        sendEvent({
          event_type: EVENT_TYPES.PAGE_INACTIVE,
          session_id: sessionId,
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
        });
        debug("PAGE_INACTIVE sent - tab hidden (inactive)");
      }

      // Always send PAGE_LEAVE here to ensure session is closed when tab is hidden
      if (!pageLeftSent && sessionStarted) {
        pageLeftSent = true;
        // Use a small delay to ensure PAGE_INACTIVE is sent first
        setTimeout(() => {
          sendEventWithBeacon({
            event_type: EVENT_TYPES.PAGE_LEAVE,
            session_id: sessionId,
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
            timestamp: new Date().toISOString(),
          });
          debug("PAGE_LEAVE sent - tab hidden (delayed)");
        }, 100);
      }
    } else {
      // Tab became visible again - start a new session
      debug("Page visible - tab switched back, starting new session");
      if (sessionStarted) {
        // Create new session for returning user
        sessionId = crypto.randomUUID();
        pageLeftSent = false;
        pageWasHidden = false;
        isPageActive = true;
        lastActivityTime = Date.now();

        debug("New session created after tab return", sessionId);

        // Send PAGE_ENTER for new session
        sendEvent({
          event_type: EVENT_TYPES.PAGE_ENTER,
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
        });

        // Send PAGE_ACTIVE immediately after
        sendEvent({
          event_type: EVENT_TYPES.PAGE_ACTIVE,
          session_id: sessionId,
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
        });

        recordActivity();
        debug("PAGE_ENTER + PAGE_ACTIVE sent - user returned to tab");
      }
    }
  });

  // Unified handler to prevent redundant events
  function handleClose() {
    if (isClosing || !sessionStarted) return;
    isClosing = true;

    // 1. Send Inactive if currently active
    if (isPageActive) {
      isPageActive = false;
      sendEvent({
        event_type: EVENT_TYPES.PAGE_INACTIVE,
        session_id: sessionId,
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        timestamp: new Date().toISOString(),
      });
      debug("PAGE_INACTIVE sent during close");
    }

    // 2. Send Leave
    if (!pageLeftSent) {
      pageLeftSent = true;
      sendEventWithBeacon({
        event_type: EVENT_TYPES.PAGE_LEAVE,
        session_id: sessionId,
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        timestamp: new Date().toISOString(),
      });
      debug("PAGE_LEAVE sent during close");
    }
  }

  // Use pagehide as the primary event for page unloading
  window.addEventListener("pagehide", handleClose, { once: true });

  // Listen for online event to flush pending events
  window.addEventListener("online", () => {
    debug("Network online - flushing pending events");
    flushPendingEvents();
  });
}

// Send event to server with retry logic
async function sendEvent(event, retries = 3) {
  try {
    debug("Sending event to API", event.event_type);
    debug("API endpoint:", TRACKING_CONFIG.API_URL);

    const response = await fetch(TRACKING_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    debug("Event sent successfully:", event.event_type);
    debug("Server response:", responseData);
    return true;
  } catch (error) {
    console.error("[DiiD-Tracker] Error sending event:", error);

    // Retry logic for critical events
    if (
      retries > 0 &&
      (event.event_type === "PAGE_ENTER" || event.event_type === "PAGE_ACTIVE")
    ) {
      debug(`Retrying ${event.event_type}... (${retries} retries left)`);
      setTimeout(() => {
        sendEvent(event, retries - 1);
      }, 1000); // Wait 1 second before retry
    } else {
      debug("Storing event in pending queue");
      storePendingEvent(event);
    }
    return false;
  }
}

// Send event using beacon (for page unload)
function sendEventWithBeacon(event) {
  try {
    debug("Sending event with beacon:", event.event_type);

    // Primary: Use fetch with keepalive (fire and forget)
    fetch(TRACKING_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      keepalive: true,
    })
      .then((response) => {
        debug("Fetch response status:", response.status);
        if (response.status === 201 || response.status === 200) {
          debug("Event sent via fetch successfully");
        }
      })
      .catch((error) => {
        console.error("[DiiD-Tracker] Fetch failed:", error);
      });

    // Backup: navigator.sendBeacon
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(event));
      const success = navigator.sendBeacon(TRACKING_CONFIG.API_URL, formData);
      debug("sendBeacon result:", success);
    } catch (beaconError) {
      console.error("[DiiD-Tracker] sendBeacon failed:", beaconError);
    }
  } catch (error) {
    console.error("[DiiD-Tracker] Error in sendEventWithBeacon:", error);
  }
}

// Store pending event in chrome storage
function storePendingEvent(event) {
  try {
    chrome.storage.local.get("pendingEvents", (result) => {
      const events = result.pendingEvents || [];
      events.push(event);
      chrome.storage.local.set({ pendingEvents: events });
      debug("Event stored in pending queue");
    });
  } catch (error) {
    console.error("[DiiD-Tracker] Error storing pending event:", error);
  }
}

// Flush pending events when online
async function flushPendingEvents() {
  try {
    chrome.storage.local.get("pendingEvents", async (result) => {
      const events = result.pendingEvents || [];

      if (events.length === 0) {
        debug("No pending events to flush");
        return;
      }

      debug(`Flushing ${events.length} pending events`);

      for (const event of events) {
        await sendEvent(event);
      }

      chrome.storage.local.set({ pendingEvents: [] });
      debug("Pending events flushed successfully");
    });
  } catch (error) {
    console.error("[DiiD-Tracker] Error flushing pending events:", error);
  }
}

/**
 * SPA navigation detection: hook history API and popstate to trigger session switch.
 * When navigating between articles on same site:
 * - Send PAGE_INACTIVE to close active period if currently active
 * - Send PAGE_LEAVE to mark end of previous article session
 * - Create NEW session_id for new article
 * - Send PAGE_ENTER + PAGE_ACTIVE for new article with new session
 */
function installSPANavigationListener() {
  let currentUrl = window.location.href;
  function onURLChange() {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      debug("SPA URL changed from", currentUrl, "to", newUrl);

      // If there is an active session, send PAGE_INACTIVE first (if currently active)
      if (sessionStarted && isPageActive) {
        isPageActive = false;
        sendEvent({
          event_type: EVENT_TYPES.PAGE_INACTIVE,
          session_id: sessionId,
          url: currentUrl,
          title: document.title,
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
        });
        debug("PAGE_INACTIVE sent before PAGE_LEAVE for SPA navigation");
      }

      // Send PAGE_LEAVE event to mark end of previous article session
      if (sessionStarted) {
        const leaveTimestamp = new Date().toISOString();
        sendEventWithBeacon({
          event_type: EVENT_TYPES.PAGE_LEAVE,
          session_id: sessionId,
          url: currentUrl,
          title: document.title,
          domain: window.location.hostname,
          timestamp: leaveTimestamp,
        });
        debug("PAGE_LEAVE sent for SPA article navigation with timestamp:", {
          timestamp: leaveTimestamp,
          sessionId: sessionId,
          from: currentUrl,
          to: newUrl,
        });

        // Create NEW session for new article
        sessionId = crypto.randomUUID();
        isPageActive = true;
        pageLeftSent = false;
        lastActivityTime = Date.now();

        debug("New session created for SPA navigation", sessionId);

        // Send PAGE_ENTER for new article
        sendEvent({
          event_type: EVENT_TYPES.PAGE_ENTER,
          session_id: sessionId,
          url: newUrl,
          title: document.title,
          domain: window.location.hostname,
          content: extractArticleContent(),
          timestamp: new Date().toISOString(),
        });
        debug("PAGE_ENTER sent for new article with new session");

        // Send PAGE_ACTIVE immediately to mark new article as active
        sendEvent({
          event_type: EVENT_TYPES.PAGE_ACTIVE,
          session_id: sessionId,
          url: newUrl,
          title: document.title,
          domain: window.location.hostname,
          timestamp: new Date().toISOString(),
        });
        isPageActive = true;
        debug("PAGE_ACTIVE sent after PAGE_ENTER for new article");
      }

      // Update URL to new URL
      currentUrl = newUrl;
    }
  }

  // Wrap pushState/replaceState
  const realPushState = history.pushState;
  history.pushState = function () {
    realPushState.apply(this, arguments);
    setTimeout(onURLChange, 0);
  };
  const realReplaceState = history.replaceState;
  history.replaceState = function () {
    realReplaceState.apply(this, arguments);
    setTimeout(onURLChange, 0);
  };
  window.addEventListener("popstate", onURLChange);
}

// Initialize when DOM is ready
try {
  debug("Content script starting initialization...");
  debug("Document ready state:", document.readyState);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installSPANavigationListener();
      initializeSession();
    });
    debug("DOMContentLoaded listener added");
  } else {
    debug("Document already loaded, initializing immediately");
    installSPANavigationListener();
    initializeSession();
  }
} catch (error) {
  console.error("[DiiD-Tracker] Error in initialization:", error);
}
