/* eslint-disable no-unused-vars */
import React from "react";
import {
  LogIn,
  Activity,
  Pause,
  LogOut,
  ArrowRightLeft,
  HelpCircle,
} from "lucide-react";

const eventMeta = {
  PAGE_ENTER: { label: "Enter", color: "text-blue-600", icon: LogIn },
  PAGE_ACTIVE: { label: "Active", color: "text-green-600", icon: Activity },
  PAGE_INACTIVE: { label: "Inactive", color: "text-gray-600", icon: Pause },
  PAGE_LEAVE: { label: "Leave", color: "text-red-600", icon: LogOut },
  PAGE_SWITCH: {
    label: "Switch",
    color: "text-orange-600",
    icon: ArrowRightLeft,
  },
};

function formatTs(ts) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }) +
    " " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
}

export default function SessionEventTimeline({ events = [] }) {
  if (!events.length) {
    return <div className="text-gray-500 text-sm">No event data</div>;
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );

  return (
    <div className="flex flex-col gap-1 py-3 px-4 bg-white rounded-lg border border-gray-100 shadow-sm">
      {sortedEvents.map((event, idx) => {
        const meta = eventMeta[event.event_type] || {
          label: event.event_type,
          color: "text-gray-600",
          icon: HelpCircle,
        };
        const Icon = meta.icon;
        return (
          <div
            className="flex items-center gap-4 py-2 relative"
            key={event.id || idx}
          >
            {/* Timeline Line */}
            {idx !== sortedEvents.length - 1 && (
              <div className="absolute left-[17px] top-[30px] bottom-[-8px] w-0.5 bg-gray-100" />
            )}

            <div
              className={`z-10 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm ${meta.color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-1 items-center justify-between gap-4">
              <span className="font-semibold text-gray-900 text-sm">
                {meta.label}
              </span>
              <span className="text-gray-400 text-xs font-medium tabular-nums bg-gray-50 px-2 py-0.5 rounded">
                {formatTs(event.timestamp)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
