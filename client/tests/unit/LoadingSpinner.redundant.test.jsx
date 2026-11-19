import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "../../src/components/LoadingSpinner.jsx";

describe("LoadingSpinner Over-Mocked Suite (Pattern C: Redundant Setup)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders status spinner element (already covered via MetricCard)", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("animate-spin");
  });
});
