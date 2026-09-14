import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ChampionRankings } from "@/lib/championSelection";
import type { Activity } from "@/lib/stats";
import type { Ranking } from "@/lib/ranking";
import { ChampionDashboard } from "./ChampionDashboard";

const ranking = (activity: Activity, displayLabel: string): Ranking => ({
  activity,
  year: 2026,
  generatedAt: "2026-09-09T19:07:12.149Z",
  entries: [{
    rank: 1,
    playerId: `${activity}-winner`,
    playerName: `${activity} winner`,
    teamName: "Anchors",
    heatNumber: 1,
    durationMs: 1000,
    formattedTime: "00:01:000",
    displayLabel,
    ...(activity === "spin" ? { rpm: 360, displayRpmLabel: "360 RPM" } : {}),
  }],
} as const);

const champions: ChampionRankings = {
  year: 2026,
  rankings: {
    beer: ranking("beer", "00:01:000"),
    sail: ranking("sail", "00:01:000"),
    spin: ranking("spin", "360 RPM"),
  },
};

describe("champion dashboard", () => {
  test("renders the latest year’s three champions and ranking links", () => {
    const markup = renderToStaticMarkup(<ChampionDashboard champions={champions} />);

    expect(markup).toContain("The best of 2026");
    expect(markup).toContain("beer winner");
    expect(markup).toContain("sail winner");
    expect(markup).toContain("spin winner");
    expect(markup).toContain("360 RPM");
    expect(markup).toContain('href="/drink?year=2026"');
    expect(markup).toContain('href="/sail?year=2026"');
    expect(markup).toContain('href="/spin?year=2026"');
  });
});
