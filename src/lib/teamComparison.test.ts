import { afterEach, describe, expect, test } from "bun:test";
import { fetchTeamComparison } from "./teamComparisonSource";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const index = {
  schemaVersion: 1,
  generatedAt: "2026-08-31T16:10:51.628Z",
  teams: [{
    teamId: "team-1",
    teamName: "Anchors",
    imageUrl: "https://images.example/anchors.png",
    isOut: false,
    players: [{ playerId: "player-1", playerName: "Ada" }],
    bestTimes: { Beer: 4250, Sail: 10334, Spin: 5906 },
    radarData: [
      { subject: "Beer", performance: 93, fullMark: 100 },
      { subject: "Sail", performance: 89, fullMark: 100 },
      { subject: "Spin", performance: 94, fullMark: 100 },
    ],
  }],
};

describe("public team comparison source", () => {
  test("loads and validates the canonical team index", async () => {
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify(index));
    };

    const result = await fetchTeamComparison(2025, "https://stats.example/");

    expect(calls).toEqual(["https://stats.example/teams/2025/index.json"]);
    expect(result.teams[0]?.teamName).toBe("Anchors");
    expect(result.teams[0]?.radarData[0]).toEqual({ subject: "Beer", performance: 93, fullMark: 100 });
  });

  test("rejects malformed radar values", async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ ...index, teams: [{ ...index.teams[0], radarData: [{ subject: "Beer", performance: 101, fullMark: 100 }] }] }));
    await expect(fetchTeamComparison(2025)).rejects.toThrow("Unsupported team comparison");
  });
});
