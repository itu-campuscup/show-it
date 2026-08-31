import type { Activity } from "./stats";

export type RankingEntry = {
  rank: number;
  playerId: string;
  playerName: string;
  teamName: string;
  heatNumber: number;
  durationMs: number;
  formattedTime: string;
  displayLabel: string;
  imageUrl?: string;
  rpm?: number;
  displayRpmLabel?: string;
};

export type Ranking = {
  activity: Activity;
  year: number;
  generatedAt: string;
  entries: RankingEntry[];
};

const activities: Record<string, Activity> = { Beer: "beer", Spin: "spin", Sail: "sail" };
const invalid = (message: string): never => { throw new Error(`Unsupported ranking: ${message}`); };
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("expected object");
  return value as Record<string, unknown>;
};
const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const positiveInteger = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;
const optionalString = (value: unknown): value is string | undefined => value === undefined || typeof value === "string";

export function parseRanking(value: unknown): Ranking {
  const root = object(value);
  const activity = typeof root.timeType === "string" ? activities[root.timeType] : undefined;
  const year = root.year;
  const generatedAt = root.generatedAt;
  const rankings = Array.isArray(root.rankings) ? root.rankings : invalid("invalid entries");
  if (!activity || !positiveInteger(year) || typeof generatedAt !== "string" || !Number.isFinite(Date.parse(generatedAt))) return invalid("invalid metadata");

  const entries = rankings.map((value) => {
    const entry = object(value);
    const { rank, playerId, playerName, teamName, heatNumber, duration, formattedTime, displayLabel, imageUrl, rpm, displayRpmLabel } = entry;
    if (!positiveInteger(rank)) return invalid("invalid rank");
    if (typeof playerId !== "string" || typeof playerName !== "string" || typeof teamName !== "string") return invalid("invalid participant");
    if (!positiveInteger(heatNumber) || !finiteNonNegative(duration)) return invalid("invalid result");
    if (typeof formattedTime !== "string" || typeof displayLabel !== "string") return invalid("invalid labels");
    if (!optionalString(imageUrl) || !optionalString(displayRpmLabel) || (rpm !== undefined && !finiteNonNegative(rpm))) return invalid("invalid optional result fields");
    return {
      rank,
      playerId,
      playerName,
      teamName,
      heatNumber,
      durationMs: duration,
      formattedTime,
      displayLabel,
      ...(imageUrl ? { imageUrl } : {}),
      ...(rpm === undefined ? {} : { rpm }),
      ...(displayRpmLabel ? { displayRpmLabel } : {}),
    } satisfies RankingEntry;
  });

  return { activity, year, generatedAt, entries };
}
