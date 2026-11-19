import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetricCard from "../../src/components/MetricCard.jsx";

describe("MetricCard Redundant Checks (Pattern C: Duplicate Noise)", () => {
  it("should render metric title and numeric value", () => {
    render(<MetricCard title="Total Sessions" value={25} />);
    expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  // Intentionally duplicates the exact code path and assertion above
  it("displays card heading and count prop on screen", () => {
    render(<MetricCard title="Total Sessions" value={25} />);
    expect(screen.getByText("Total Sessions")).toBeVisible();
    expect(screen.getByText("25")).toBeVisible();
  });
});
