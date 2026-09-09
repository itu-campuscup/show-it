import { describe, expect, test } from "bun:test";
import type { Ranking } from "./ranking";
import { selectLatestChampions } from "./championSelection";

const ranking = (activity: Ranking["activity"], year: number, hasWinner: boolean): Ranking => ({
  activity,
  year,
  generatedAt: "2026-09-09T19:07:12.149Z",
  entries: hasWinner ? [{
    rank: 1,
    playerId: `${activity}-${year}`,
    playerName: `${activity} winner`,
    teamName: "Anchors",
    heatNumber: 1,
    durationMs: 1000,
    formattedTime: "00:01:000",
    displayLabel: activity === "spin" ? "360 RPM" : "00:01:000",
    ...(activity === "spin" ? { rpm: 360, displayRpmLabel: "360 RPM" } : {}),
  }] : [],
});

describe("latest champion selection", () => {
  test("falls back when the newest year has no ranked results", async () => {
    const calls: string[] = [];
    const result = await selectLatestChampions([2026, 2025], async (activity, year) => {
      calls.push(`${year}-${activity}`);
      return ranking(activity, year, year === 2025);
    });

    expect(result.year).toBe(2025);
    expect(calls).toEqual(["2026-beer", "2026-sail", "2026-spin", "2025-beer", "2025-sail", "2025-spin"]);
    expect(result.rankings.beer.entries[0]?.playerName).toBe("beer winner");
  });
});
