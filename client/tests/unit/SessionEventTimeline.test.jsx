import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionEventTimeline from "../../src/components/SessionEventTimeline.jsx";

describe("SessionEventTimeline (Pattern A: Gold Standard)", () => {
  it("renders empty state when events array is empty or omitted", () => {
    const { rerender } = render(<SessionEventTimeline />);
    expect(screen.getByText("No event data")).toBeInTheDocument();

    rerender(<SessionEventTimeline events={[]} />);
    expect(screen.getByText("No event data")).toBeInTheDocument();
  });

  it("sorts events chronologically and renders mapped labels", () => {
    const unsortedEvents = [
      {
        id: "evt-3",
        event_type: "PAGE_LEAVE",
        timestamp: "2026-08-18T10:05:00.000Z",
      },
      {
        id: "evt-1",
        event_type: "PAGE_ENTER",
        timestamp: "2026-08-18T10:00:00.000Z",
      },
      {
        id: "evt-2",
        event_type: "PAGE_ACTIVE",
        timestamp: "2026-08-18T10:01:00.000Z",
      },
      {
        id: "evt-4",
        event_type: "PAGE_INACTIVE",
        timestamp: "2026-08-18T10:02:00.000Z",
      },
      {
        id: "evt-5",
        event_type: "PAGE_SWITCH",
        timestamp: "2026-08-18T10:03:00.000Z",
      },
    ];

    const { container } = render(
      <SessionEventTimeline events={unsortedEvents} />,
    );

    const labels = Array.from(container.querySelectorAll("span.font-semibold")).map(
      (el) => el.textContent,
    );

    expect(labels).toEqual(["Enter", "Active", "Inactive", "Switch", "Leave"]);
  });

  it("falls back to raw event_type for unknown event types", () => {
    const events = [
      {
        event_type: "CUSTOM_SCROLL",
        timestamp: "2026-08-18T10:00:00.000Z",
      },
    ];

    render(<SessionEventTimeline events={events} />);
    expect(screen.getByText("CUSTOM_SCROLL")).toBeInTheDocument();
  });
});
