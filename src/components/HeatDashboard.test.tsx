import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Snapshot } from "@/lib/snapshot";
import type { Ranking } from "@/lib/ranking";
import { ActivityPresentation } from "./ActivityPresentation";
import { HeatDashboard } from "./HeatDashboard";

const snapshot: Snapshot = {
  schemaVersion: 1,
  generatedAt: "2026-05-17T12:05:00.000Z",
  sourceFetchedAt: "2026-05-17T12:04:58.000Z",
  currentHeat: { id: "heat-4", number: 4, year: 2026, date: "2026-05-17", state: "running", activeActivity: "beer" },
  activities: {
    beer: { completed: [{ id: "beer-1", rank: 1, playerName: "Ada", teamName: "Anchors", durationMs: 4250, formattedTime: "00:04:250", displayLabel: "00:04:250" }], active: [], attemptsStarted: 1, attemptsCompleted: 1 },
    spin: { completed: [], active: [], attemptsStarted: 0, attemptsCompleted: 0 },
    sail: { teams: [{ teamId: "team-1", teamName: "Anchors", sailLogCount: 4, handoffCount: 1, completedLegCount: 1, status: "racing", currentPlayerName: "Ada", startedAt: "2026-05-17T12:00:00.000Z", elapsedMsAtSnapshot: 300000 }] },
  },
};

describe("HeatDashboard rendering", () => {
  test("shows current heat, source time, exact activity, summaries, and links", () => {
    const markup = renderToStaticMarkup(<HeatDashboard initialSnapshot={snapshot} />);
    expect(markup).toContain("Heat 4");
    expect(markup).toContain("Source updated");
    expect(markup).toContain("Drink");
    expect(markup).toContain("Drink completed");
    expect(markup).toContain('href="/sail"');
  });

  test("uses unavailable copy when no snapshot exists", () => {
    const markup = renderToStaticMarkup(<HeatDashboard initialSnapshot={null} initialError="Feed unavailable" />);
    expect(markup).toContain("Current heat unavailable");
    expect(markup).toContain("Snapshot unavailable");
    expect(markup).toContain("Feed unavailable");
    expect(markup).toContain("The current activity is unavailable.");
  });
});

describe("ActivityPresentation rendering", () => {
  const ranking = (activity: Ranking["activity"], entries: Ranking["entries"]): Ranking => ({
    activity,
    year: 2025,
    generatedAt: "2026-08-31T15:53:35.647Z",
    entries,
  });

  test("renders explicit no-data state for an empty year ranking", () => {
    const markup = renderToStaticMarkup(<ActivityPresentation activity="spin" ranking={ranking("spin", [])} />);
    expect(markup).toContain("No ranked results for 2025.");
  });

  test("renders the published year-wide Spin ranking", () => {
    const markup = renderToStaticMarkup(<ActivityPresentation activity="spin" ranking={ranking("spin", [{
      rank: 1, playerId: "p1", playerName: "Noah Wagenen", teamName: "Mændfrøskorpset", heatNumber: 7,
      durationMs: 5906, formattedTime: "00:05:905", displayLabel: "102 RPM", rpm: 101.59, displayRpmLabel: "102 RPM",
    }])} />);
    expect(markup).toContain("Noah Wagenen");
    expect(markup).toContain("Heat 7");
    expect(markup).toContain("102 RPM");
  });

  test("renders Sail as a year-wide time ranking", () => {
    const markup = renderToStaticMarkup(<ActivityPresentation activity="sail" ranking={ranking("sail", [{
      rank: 1, playerId: "p1", playerName: "Matteo Guglielmi", teamName: "Hellige Firenighed", heatNumber: 1,
      durationMs: 10334, formattedTime: "00:10:333", displayLabel: "00:10:333",
    }])} />);
    expect(markup).toContain("Matteo Guglielmi");
    expect(markup).toContain("00:10:333");
    expect(markup).not.toContain("Racing");
  });
});
