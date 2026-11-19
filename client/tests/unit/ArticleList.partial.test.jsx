import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ArticleList from "../../src/components/ArticleList.jsx";

describe("ArticleList (Pattern B: Partial Coverage + Pattern D: Unit Fail)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders article rows with formatted read time", () => {
    const articles = [
      {
        id: 1,
        title: "AI Advances in 2026",
        domain: "vnexpress.net",
        read_count: 4,
        total_read_time: 125,
        summary: "Detailed summary of AI trends.",
        topic: "Technology",
      },
    ];

    render(<ArticleList articles={articles} />);

    expect(screen.getByText("AI Advances in 2026")).toBeInTheDocument();
    expect(screen.getByText("vnexpress.net")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2m 5s")).toBeInTheDocument();
  });

  it("expands row to display article summary and topic on click", () => {
    const articles = [
      {
        id: 2,
        title: "Economic Outlook",
        domain: "dantri.com.vn",
        read_count: 2,
        total_read_time: 60,
        summary: "Summary text for economy.",
        topic: "Economy",
      },
    ];

    render(<ArticleList articles={articles} />);
    fireEvent.click(screen.getByText("Economic Outlook"));

    expect(screen.getByText("Summary text for economy.")).toBeInTheDocument();
    expect(screen.getByText("Economy")).toBeInTheDocument();
  });

  // Pattern D - Intentional Unit Failure #1 (Logic/Format Mismatch):
  // ArticleList.formatTime(-5) returns "0m 0s", whereas this test expects "00:00".
  it("formats negative read duration as 00:00", () => {
    const articles = [
      {
        id: 3,
        title: "Corrupted Duration Article",
        domain: "tuoitre.vn",
        read_count: 1,
        total_read_time: -5,
      },
    ];

    render(<ArticleList articles={articles} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });
});
