import { describe, expect, test } from "bun:test";
import { currentHeatRankingPath, statsBaseUrl } from "./stats";

describe("spectator stats paths", () => {
  test("uses the CampusCup static stats site by default", () => {
    expect(statsBaseUrl(undefined)).toBe("https://itu-campuscup.github.io/judge-it-stats");
    expect(statsBaseUrl("https://stats.example/ ")).toBe("https://stats.example");
  });

  test("selects a time-type file for the current heat", () => {
    expect(currentHeatRankingPath("https://stats.example", 2026, 4, "spin")).toBe(
      "https://stats.example/rankings/2026/heat-4/spin.json",
    );
  });
});
