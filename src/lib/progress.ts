export type RecordLike = Record<string, unknown>;

export type ProgressInput = {
  currentHeat: RecordLike | null;
  teams: RecordLike[];
  players: RecordLike[];
  timeTypes: RecordLike[];
  timeLogs: RecordLike[];
};

type Completion = {
  playerName: string;
  teamName: string;
  teamId: string;
  durationMs: number;
  rpm?: number;
};

type ActivityProgress = {
  completed: Completion[];
  activeByTeam: Record<string, string>;
  sailCountByTeam: Record<string, number>;
  currentPlayerByTeam: Record<string, string>;
  teamNameByTeam: Record<string, string>;
};

const activityName = (value: unknown) => String(value ?? "").toLowerCase();
const id = (value: RecordLike) => String(value._id ?? value.id ?? "");

export function timeToMilliseconds(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  return (
    Number(match[1]) * 3_600_000 +
    Number(match[2]) * 60_000 +
    Number(match[3]) * 1_000 +
    Number((match[4] ?? "").padEnd(3, "0"))
  );
}

export function formatDuration(milliseconds: number | null): string {
  return milliseconds === null ? "–" : `${(milliseconds / 1_000).toFixed(2)}s`;
}

export function buildHeatProgress(input: ProgressInput) {
  const heatId = input.currentHeat ? id(input.currentHeat) : "";
  const players = new Map(input.players.map((player) => [id(player), String(player.name ?? "Unknown")]));
  const teams = new Map(input.teams.map((team) => [id(team), String(team.name ?? "Unknown team")]));
  const typeById = new Map(input.timeTypes.map((type) => [id(type), activityName(type.time_eng)]));
  const activities: Record<string, ActivityProgress> = {
    beer: { completed: [], activeByTeam: {}, sailCountByTeam: {}, currentPlayerByTeam: {}, teamNameByTeam: {} },
    spin: { completed: [], activeByTeam: {}, sailCountByTeam: {}, currentPlayerByTeam: {}, teamNameByTeam: {} },
    sail: { completed: [], activeByTeam: {}, sailCountByTeam: {}, currentPlayerByTeam: {}, teamNameByTeam: {} },
  };

  const logs: Array<RecordLike & { timestamp: number }> = input.timeLogs
    .filter((log) => String(log.heat_id ?? "") === heatId)
    .map((log) => ({ ...log, timestamp: timeToMilliseconds(log.time) }))
    .filter((log): log is RecordLike & { timestamp: number } => log.timestamp !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const activity of ["beer", "spin"] as const) {
    const typeIds = new Set([...typeById.entries()].filter(([, name]) => name === activity).map(([typeId]) => typeId));
    const pending = new Map<string, RecordLike & { timestamp: number }>();
    for (const log of logs.filter((item) => typeIds.has(String(item.time_type_id ?? "")))) {
      const playerId = String(log.player_id ?? "");
      // Judge IT pairs a player's consecutive activity logs within a heat. The
      // current heat is already scoped above, so team assignment must not split a pair.
      const key = playerId;
      const start = pending.get(key);
      if (!start) {
        pending.set(key, log);
        activities[activity].activeByTeam[String(log.team_id ?? "")] = players.get(playerId) ?? "Unknown";
        continue;
      }
      const durationMs = log.timestamp - start.timestamp;
      const teamId = String(start.team_id ?? log.team_id ?? "");
      activities[activity].completed.push({
        playerName: players.get(playerId) ?? "Unknown",
        teamName: teams.get(teamId) ?? "Unknown team",
        teamId,
        durationMs,
        ...(activity === "spin" ? { rpm: durationMs > 0 ? 600_000 / durationMs : 0 } : {}),
      });
      pending.delete(key);
      delete activities[activity].activeByTeam[teamId];
    }
  }

  const sailTypeIds = new Set([...typeById.entries()].filter(([, name]) => name === "sail").map(([typeId]) => typeId));
  for (const log of logs.filter((item) => sailTypeIds.has(String(item.time_type_id ?? "")))) {
    const teamId = String(log.team_id ?? "");
    activities.sail.sailCountByTeam[teamId] = (activities.sail.sailCountByTeam[teamId] ?? 0) + 1;
    activities.sail.teamNameByTeam[teamId] = teams.get(teamId) ?? "Unknown team";
    activities.sail.currentPlayerByTeam[teamId] = players.get(String(log.player_id ?? "")) ?? "Unknown";
  }

  for (const activity of ["beer", "spin"] as const) {
    activities[activity].completed.sort((a, b) => a.durationMs - b.durationMs);
  }

  return {
    heatNumber: Number(input.currentHeat?.heat ?? 0),
    activities,
  };
}
