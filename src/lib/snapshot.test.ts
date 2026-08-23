import { describe, expect, test } from "bun:test";
import { isStaleSnapshot, parseCurrentHeatSnapshot, sailSlots } from "./snapshot";

const valid = {
  schemaVersion: 1, generatedAt: "2026-05-17T12:05:00.000Z", sourceFetchedAt: "2026-05-17T12:04:58.000Z",
  currentHeat: { id: "heat-4", number: 4, year: 2026, date: "2026-05-17", state: "running" },
  activities: {
    beer: { completed: [{ id: "beer-1", rank: 1, playerName: "Ada", teamName: "Anchors", durationMs: 4250, formattedTime: "00:04:250", displayLabel: "00:04:250" }], active: [], attemptsStarted: 1, attemptsCompleted: 1 },
    spin: { completed: [], active: [{ playerId: "p2", playerName: "Ben", startedAt: "2026-05-17T12:04:00.000Z", elapsedMsAtSnapshot: 60000 }], attemptsStarted: 1, attemptsCompleted: 0 },
    sail: { teams: [{ teamId: "t1", teamName: "Anchors", sailLogCount: 15, handoffCount: 7, completedLegCount: 7, status: "racing", currentPlayerName: "Ada", startedAt: "2026-05-17T12:00:00.000Z", elapsedMsAtSnapshot: 300000 }] },
  },
};

describe("current heat snapshot", () => {
  test("accepts the versioned spectator snapshot contract", () => {
    const snapshot = parseCurrentHeatSnapshot(valid);
    expect(snapshot.currentHeat.number).toBe(4);
    expect(snapshot.activities.sail.teams[0].sailLogCount).toBe(15);
  });
  test("rejects malformed snapshots instead of crashing the UI", () => {
    expect(() => parseCurrentHeatSnapshot({ schemaVersion: 2 })).toThrow("Unsupported snapshot");
    expect(() => parseCurrentHeatSnapshot({ ...valid, activities: { ...valid.activities, beer: { ...valid.activities.beer, completed: [{}] } } })).toThrow("Unsupported snapshot");
  });
  test("creates a sixteen-position relay board and caps invalid counts", () => {
    expect(sailSlots(15)).toEqual([true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false]);
    expect(sailSlots(20)).toHaveLength(16);
    expect(sailSlots(-1).every((slot) => !slot)).toBe(true);
  });
  test("marks old published data stale without pretending it is live", () => {
    expect(isStaleSnapshot(valid.generatedAt, new Date("2026-05-17T12:12:01.000Z"))).toBe(true);
    expect(isStaleSnapshot(valid.generatedAt, new Date("2026-05-17T12:10:00.000Z"))).toBe(false);
  });
});
