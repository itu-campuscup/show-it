import { afterEach, describe, expect, test } from "bun:test";
import { fetchLatestRanking } from "./rankingSource";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const spinRanking = {
  timeType: "Spin",
  year: 2025,
  generatedAt: "2026-08-31T15:53:35.647Z",
  rankings: [{
    rank: 1,
    playerId: "p1",
    playerName: "Noah Wagenen",
    teamName: "Mændfrøskorpset",
    heatNumber: 7,
    duration: 5906,
    formattedTime: "00:05:905",
    displayLabel: "102 RPM",
    rpm: 101.59,
    displayRpmLabel: "102 RPM",
  }],
};

describe("published year ranking source", () => {
  test("loads the latest year and maps publisher durations", async () => {
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify(calls.length === 1 ? { years: [2024, 2025] } : spinRanking));
    };

    const ranking = await fetchLatestRanking("spin", "https://stats.example/");

    expect(calls).toEqual([
      "https://stats.example/index.json",
      "https://stats.example/rankings/2025/spin.json",
    ]);
    expect(ranking.entries[0]).toMatchObject({ playerName: "Noah Wagenen", durationMs: 5906, heatNumber: 7 });
  });

  test("rejects a ranking for a different activity", async () => {
    let call = 0;
    globalThis.fetch = async () => new Response(JSON.stringify(call++ === 0 ? { years: [2025] } : { ...spinRanking, timeType: "Sail" }));
    await expect(fetchLatestRanking("spin")).rejects.toThrow("did not match");
  });
});
