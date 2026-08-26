// Background Script for Reading Activity Tracker Extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "LOG_EVENT") {
    console.log("Event logged from content script:", request.data);
    sendResponse({ status: "received" });
  }
});

// Check if extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Reading Activity Tracker Extension installed");
  } else if (details.reason === "update") {
    console.log("Reading Activity Tracker Extension updated");
  }
});

// Periodic cleanup of old pending events (older than 7 days)
chrome.alarms.create("cleanupOldEvents", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanupOldEvents") {
    chrome.storage.local.get("pendingEvents", (result) => {
      if (result.pendingEvents && result.pendingEvents.length > 0) {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentEvents = result.pendingEvents.filter(
          (event) => new Date(event.timestamp).getTime() > sevenDaysAgo,
        );
        chrome.storage.local.set({ pendingEvents: recentEvents });
        console.log(`Cleaned up old events. Remaining: ${recentEvents.length}`);
      }
    });
  }
});
