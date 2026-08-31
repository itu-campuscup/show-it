export type RadarMetric = { subject: "Beer" | "Sail" | "Spin"; performance: number; fullMark: 100 };
export type ComparisonTeam = {
  teamId: string;
  teamName: string;
  imageUrl?: string;
  isOut: boolean;
  players: Array<{ playerId: string; playerName: string }>;
  bestTimes: Partial<Record<RadarMetric["subject"], number>>;
  radarData: RadarMetric[];
};
export type TeamComparison = { schemaVersion: 1; generatedAt: string; teams: ComparisonTeam[] };

const invalid = (message: string): never => { throw new Error(`Unsupported team comparison: ${message}`); };
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("expected object");
  return value as Record<string, unknown>;
};
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const subjects = ["Beer", "Sail", "Spin"] as const;
const subjectLookup: Record<RadarMetric["subject"], true> = { Beer: true, Sail: true, Spin: true };
const isSubject = (value: unknown): value is RadarMetric["subject"] => typeof value === "string" && Object.hasOwn(subjectLookup, value);

export function parseTeamComparison(value: unknown): TeamComparison {
  const root = record(value);
  const schemaVersion = root.schemaVersion;
  const generatedAt = root.generatedAt;
  const rawTeams = Array.isArray(root.teams) ? root.teams : invalid("invalid teams");
  if (schemaVersion !== 1 || typeof generatedAt !== "string" || !Number.isFinite(Date.parse(generatedAt))) return invalid("invalid metadata");

  const teams = rawTeams.map((value) => {
    const team = record(value);
    const { teamId, teamName, imageUrl, isOut } = team;
    if (typeof teamId !== "string" || typeof teamName !== "string" || (imageUrl !== undefined && typeof imageUrl !== "string") || typeof isOut !== "boolean") return invalid("invalid team");
    const rawPlayers = Array.isArray(team.players) ? team.players : invalid("invalid players");
    const players = rawPlayers.map((value) => {
      const player = record(value);
      if (typeof player.playerId !== "string" || typeof player.playerName !== "string") return invalid("invalid player");
      return { playerId: player.playerId, playerName: player.playerName };
    });
    const rawBestTimes = record(team.bestTimes);
    const bestTimes: ComparisonTeam["bestTimes"] = {};
    for (const subject of subjects) {
      const value = rawBestTimes[subject];
      if (value !== undefined) {
        if (!finite(value)) return invalid("invalid best time");
        bestTimes[subject] = value;
      }
    }
    const rawRadar = Array.isArray(team.radarData) ? team.radarData : invalid("invalid radar data");
    const radarData = rawRadar.map((value) => {
      const metric = record(value);
      if (!isSubject(metric.subject) || !finite(metric.performance) || metric.performance > 100 || metric.fullMark !== 100) return invalid("invalid radar metric");
      return { subject: metric.subject, performance: metric.performance, fullMark: 100 as const };
    });
    if (radarData.length !== 3 || new Set(radarData.map(({ subject }) => subject)).size !== 3) return invalid("incomplete radar data");
    return { teamId, teamName, ...(imageUrl ? { imageUrl } : {}), isOut, players, bestTimes, radarData };
  });

  return { schemaVersion: 1, generatedAt, teams };
}
