import { describe, expect, test } from "bun:test";
import { buildHeatProgress, formatDuration } from "./progress";

const fixture = {
  currentHeat: { _id: "heat-1", heat: 3, date: "2026-05-17", is_current: true },
  teams: [
    { _id: "team-a", name: "Anchors", player_1_id: "player-a" },
    { _id: "team-b", name: "Buoys", player_1_id: "player-b" },
  ],
  players: [
    { _id: "player-a", name: "Ada" },
    { _id: "player-b", name: "Ben" },
  ],
  timeTypes: [
    { _id: "beer", time_eng: "Beer" },
    { _id: "spin", time_eng: "Spin" },
    { _id: "sail", time_eng: "Sail" },
  ],
  timeLogs: [
    { _id: "1", heat_id: "heat-1", team_id: "team-a", player_id: "player-a", time_type_id: "beer", time: "12:00:00.000" },
    { _id: "2", heat_id: "heat-1", team_id: "team-a", player_id: "player-a", time_type_id: "beer", time: "12:00:04.250" },
    { _id: "3", heat_id: "heat-1", team_id: "team-b", player_id: "player-b", time_type_id: "spin", time: "12:00:05.000" },
    { _id: "4", heat_id: "heat-1", team_id: "team-b", player_id: "player-b", time_type_id: "spin", time: "12:00:15.000" },
    { _id: "5", heat_id: "heat-1", team_id: "team-a", player_id: "player-a", time_type_id: "sail", time: "12:00:20.000" },
    { _id: "6", heat_id: "heat-1", team_id: "team-a", player_id: "player-a", time_type_id: "sail", time: "12:00:24.000" },
    { _id: "7", heat_id: "heat-1", team_id: "team-a", player_id: "player-a", time_type_id: "sail", time: "12:00:26.000" },
  ],
};

describe("buildHeatProgress", () => {
  test("groups live activity by team and reports completed pairs", () => {
    const progress = buildHeatProgress(fixture);

    expect(progress.heatNumber).toBe(3);
    expect(progress.activities.beer.completed).toHaveLength(1);
    expect(progress.activities.beer.completed[0]).toMatchObject({
      playerName: "Ada",
      teamName: "Anchors",
      durationMs: 4250,
    });
    expect(progress.activities.spin.completed[0]).toMatchObject({
      playerName: "Ben",
      rpm: 60,
    });
    expect(progress.activities.sail.sailCountByTeam).toEqual({ "team-a": 3 });
    expect(progress.activities.sail.currentPlayerByTeam).toEqual({ "team-a": "Ada" });
    expect(progress.activities.sail.teamNameByTeam).toEqual({ "team-a": "Anchors" });
  });

  test("formats durations for the spectator UI", () => {
    expect(formatDuration(4250)).toBe("4.25s");
    expect(formatDuration(null)).toBe("–");
  });
});
