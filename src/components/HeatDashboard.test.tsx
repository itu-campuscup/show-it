import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Snapshot } from "@/lib/snapshot";
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
  test("renders explicit no-data state for empty activity results", () => {
    const markup = renderToStaticMarkup(<ActivityPresentation activity="spin" snapshot={snapshot} />);
    expect(markup).toContain("No completed results in this snapshot.");
    expect(markup).toContain("No current attempts in this snapshot.");
  });

  test("keeps Sail spectator-safe and names current sailor or winner", () => {
    const racing = renderToStaticMarkup(<ActivityPresentation activity="sail" snapshot={snapshot} />);
    expect(racing).toContain("Current sailor: Ada");
    expect(racing).toContain("Racing");
    expect(racing).not.toContain("4/16");

    const finishedSnapshot = { ...snapshot, activities: { ...snapshot.activities, sail: { teams: [{ ...snapshot.activities.sail.teams[0], status: "finished" as const, currentPlayerName: undefined, finishedAt: "2026-05-17T12:05:00.000Z" }] } } };
    const finished = renderToStaticMarkup(<ActivityPresentation activity="sail" snapshot={finishedSnapshot} />);
    expect(finished).toContain("Finished winner");
    expect(finished).not.toContain("Current sailor:");
  });
});
