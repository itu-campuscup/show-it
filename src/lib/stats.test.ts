import { describe, expect, test } from "bun:test";
import { currentHeatSnapshotPath, statsBaseUrl } from "./stats";

describe("spectator stats paths", () => {
  test("uses the CampusCup static stats site by default", () => {
    expect(statsBaseUrl(undefined)).toBe("https://itu-campuscup.github.io/judge-it-stats");
    expect(statsBaseUrl("https://stats.example/ ")).toBe("https://stats.example");
  });

  test("selects the atomic current-heat snapshot", () => {
    expect(currentHeatSnapshotPath("https://stats.example")).toBe("https://stats.example/current-heat.json");
  });
});
