import { describe, expect, test } from "bun:test";
import { isStaleSnapshot, parseCurrentHeatSnapshot, sailSlots } from "./snapshot";

const valid = {
  schemaVersion: 1, generatedAt: "2026-05-17T12:05:00.000Z", sourceFetchedAt: "2026-05-17T12:04:58.000Z",
  currentHeat: { id: "heat-4", number: 4, year: 2026, date: "2026-05-17", state: "running", activeActivity: "beer" },
  activities: {
    beer: { completed: [{ id: "beer-1", rank: 1, playerName: "Ada", teamName: "Anchors", durationMs: 4250, formattedTime: "00:04:250", displayLabel: "00:04:250" }], active: [], attemptsStarted: 1, attemptsCompleted: 1 },
    spin: { completed: [], active: [{ playerId: "p2", playerName: "Ben", startedAt: "2026-05-17T12:04:00.000Z", elapsedMsAtSnapshot: 60000 }], attemptsStarted: 1, attemptsCompleted: 0 },
    sail: { teams: [{ teamId: "t1", teamName: "Anchors", sailLogCount: 15, handoffCount: 7, completedLegCount: 7, status: "racing", currentPlayerName: "Ada", startedAt: "2026-05-17T12:00:00.000Z", elapsedMsAtSnapshot: 300000 }] },
  },
};

const unknown = {
  ...valid,
  currentHeat: { id: "", number: 0, year: 0, date: "", state: "unknown", activeActivity: null },
};

const expectRejected = (snapshot: unknown) => expect(() => parseCurrentHeatSnapshot(snapshot)).toThrow("Unsupported snapshot");

describe("current heat snapshot", () => {
  test("accepts the versioned spectator snapshot contract", () => {
    const snapshot = parseCurrentHeatSnapshot(valid);
    expect(snapshot.currentHeat.number).toBe(4);
    expect(snapshot.currentHeat.activeActivity).toBe("beer");
    expect(snapshot.activities.sail.teams[0].sailLogCount).toBe(15);
  });
  test("accepts every valid active activity", () => {
    for (const activeActivity of ["beer", "spin", "sail", null] as const) {
      expect(parseCurrentHeatSnapshot({ ...valid, currentHeat: { ...valid.currentHeat, activeActivity } }).currentHeat.activeActivity).toBe(activeActivity);
    }
  });
  test("accepts the publisher unknown heat sentinel", () => {
    expect(parseCurrentHeatSnapshot(unknown).currentHeat.state).toBe("unknown");
  });
  test("rejects every other unknown heat metadata shape", () => {
    expectRejected({ ...valid, currentHeat: { ...unknown.currentHeat, id: "heat-4" } });
    expectRejected({ ...unknown, currentHeat: { ...unknown.currentHeat, publishedAt: "" } });
  });
  test("rejects malformed snapshots instead of crashing the UI", () => {
    expectRejected({ schemaVersion: 2 });
    expectRejected({ ...valid, activities: { ...valid.activities, beer: { ...valid.activities.beer, completed: [{}] } } });
  });
  test("rejects an invalid active activity", () => {
    expectRejected({ ...valid, currentHeat: { ...valid.currentHeat, activeActivity: "kayak" } });
  });
  test("rejects non-finite or negative durations, RPM, and elapsed times", () => {
    expectRejected({ ...valid, activities: { ...valid.activities, beer: { ...valid.activities.beer, completed: [{ ...valid.activities.beer.completed[0], durationMs: Number.NaN }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, beer: { ...valid.activities.beer, completed: [{ ...valid.activities.beer.completed[0], durationMs: -1 }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, spin: { ...valid.activities.spin, completed: [{ id: "spin-1", rank: 1, playerName: "Ada", teamName: "Anchors", durationMs: 10, formattedTime: "00:00:010", displayLabel: "00:00:010", rpm: -1 }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, spin: { ...valid.activities.spin, completed: [{ id: "spin-1", rank: 1, playerName: "Ada", teamName: "Anchors", durationMs: 10, formattedTime: "00:00:010", displayLabel: "00:00:010", rpm: Infinity }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, spin: { ...valid.activities.spin, active: [{ ...valid.activities.spin.active[0], elapsedMsAtSnapshot: Infinity }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, spin: { ...valid.activities.spin, active: [{ ...valid.activities.spin.active[0], elapsedMsAtSnapshot: -1 }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, sail: { teams: [{ ...valid.activities.sail.teams[0], elapsedMsAtSnapshot: -1 }] } } });
  });
  test("rejects non-positive ranks", () => {
    expectRejected({ ...valid, activities: { ...valid.activities, beer: { ...valid.activities.beer, completed: [{ ...valid.activities.beer.completed[0], rank: 0 }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, spin: { ...valid.activities.spin, completed: [{ id: "spin-1", rank: -1, playerName: "Ada", teamName: "Anchors", durationMs: 10, formattedTime: "00:00:010", displayLabel: "00:00:010" }] } } });
  });
  test("rejects invalid timestamps", () => {
    expectRejected({ ...valid, generatedAt: "not-a-date" });
    expectRejected({ ...valid, activities: { ...valid.activities, spin: { ...valid.activities.spin, active: [{ ...valid.activities.spin.active[0], startedAt: "not-a-date" }] } } });
    expectRejected({ ...valid, activities: { ...valid.activities, sail: { teams: [{ ...valid.activities.sail.teams[0], finishedAt: "not-a-date" }] } } });
  });
  test("requires finished Sail teams to include finishedAt", () => {
    expectRejected({ ...valid, activities: { ...valid.activities, sail: { teams: [{ ...valid.activities.sail.teams[0], status: "finished" }] } } });
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

