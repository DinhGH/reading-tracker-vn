// Popup Script for Reading Activity Tracker Extension

// Update session information in popup
function updateSessionInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    // Get pending events from storage
    chrome.storage.local.get("pendingEvents", (result) => {
      const pendingEvents = result.pendingEvents || [];
      const sessionEvents = pendingEvents.filter(
        (event) => event.url === activeTab.url,
      );

      // Calculate active time from events
      let totalActiveTime = 0;
      sessionEvents.forEach((event) => {
        if (event.event_type === "PAGE_ACTIVE") {
          totalActiveTime += 5000; // Approximate 5 seconds per active event
        }
      });

      // Update UI
      const sessionIdElement = document.getElementById("sessionId");
      const activeTimeElement = document.getElementById("activeTime");

      if (sessionEvents.length > 0) {
        const sessionId = sessionEvents[0].session_id || "Unknown";
        sessionIdElement.textContent = sessionId.substring(0, 8) + "...";
        activeTimeElement.textContent = formatTime(totalActiveTime);
      } else {
        sessionIdElement.textContent = "No session";
        activeTimeElement.textContent = "0s";
      }
    });
  });
}

// Format time in seconds to readable format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Handle Dashboard button click
document.getElementById("dashboardBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: "http://localhost:5173" });
});

// Handle Settings button click
// document.getElementById("settingsBtn").addEventListener("click", () => {
//   alert("Settings page coming soon!");
// });

// Handle Support link click
document.getElementById("supportLink").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://github.com/support" });
});

// Handle Feedback link click
document.getElementById("feedbackLink").addEventListener("click", () => {
  alert("Thank you for your interest! Feedback feature coming soon.");
});

// Handle Privacy link click
document.getElementById("privacyLink").addEventListener("click", () => {
  alert("Privacy policy information coming soon.");
});

// Update session info on popup load
document.addEventListener("DOMContentLoaded", () => {
  updateSessionInfo();

  // Refresh every 5 seconds
  setInterval(updateSessionInfo, 5000);
});
