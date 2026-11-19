import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetricCard from "../../src/components/MetricCard.jsx";

describe("MetricCard (Pattern A: Gold Standard)", () => {
  it("renders title and numeric value including zero", () => {
    render(<MetricCard title="Total Articles" value={0} />);

    expect(screen.getByText("Total Articles")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders string formatted duration value", () => {
    render(<MetricCard title="Total Read Time" value="5 min 12 sec" />);

    expect(screen.getByText("Total Read Time")).toBeInTheDocument();
    expect(screen.getByText("5 min 12 sec")).toBeInTheDocument();
  });

  it("renders LoadingSpinner when value is null or omitted", () => {
    render(<MetricCard title="Active Sessions" value={null} />);

    expect(screen.getByText("Active Sessions")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders custom icon component when provided and skips when omitted", () => {
    const MockIcon = () => <svg data-testid="metric-icon" />;
    const { rerender } = render(
      <MetricCard title="Sessions" value={14} icon={MockIcon} />,
    );

    expect(screen.getByTestId("metric-icon")).toBeInTheDocument();

    rerender(<MetricCard title="Sessions" value={14} />);
    expect(screen.queryByTestId("metric-icon")).not.toBeInTheDocument();
  });
});
