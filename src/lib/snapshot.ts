export type Result = { id: string; rank: number; playerName: string; teamName: string; durationMs: number; formattedTime: string; displayLabel: string; rpm?: number; displayRpmLabel?: string; imageUrl?: string };
export type ActiveAttempt = { playerId: string; playerName: string; teamName?: string; startedAt: string; elapsedMsAtSnapshot: number };
export type CurrentHeat = { id: string; number: number; year: number; date: string; state: "running" | "completed" | "unknown"; activeActivity: "beer" | "spin" | "sail" | null };
export type Snapshot = { schemaVersion: 1; generatedAt: string; sourceFetchedAt: string; currentHeat: CurrentHeat; activities: { beer: { completed: Result[]; active: ActiveAttempt[]; attemptsStarted: number; attemptsCompleted: number }; spin: { completed: Result[]; active: ActiveAttempt[]; attemptsStarted: number; attemptsCompleted: number }; sail: { teams: Array<{ teamId: string; teamName: string; imageUrl?: string; sailLogCount: number; handoffCount: number; completedLegCount: number; status: "racing" | "finished" | "unknown"; currentPlayerName?: string; startedAt: string; elapsedMsAtSnapshot: number; finishedAt?: string }> } } };

const invalid = (message: string): never => { throw new Error(`Unsupported snapshot: ${message}`); };
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("expected object");
  return value as Record<string, unknown>;
};
const array = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) invalid("expected array");
  return value as unknown[];
};
const finiteNonNegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const timestamp = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));
const optionalString = (item: Record<string, unknown>, name: string): boolean => !(name in item) || typeof item[name] === "string";

const result = (value: unknown): void => {
  const item = object(value);
  if (typeof item.id !== "string" || !positive(item.rank) || typeof item.playerName !== "string" || typeof item.teamName !== "string" || !finiteNonNegative(item.durationMs) || typeof item.formattedTime !== "string" || typeof item.displayLabel !== "string") invalid("invalid result");
  if (("rpm" in item && !finiteNonNegative(item.rpm)) || !optionalString(item, "displayRpmLabel") || !optionalString(item, "imageUrl")) invalid("invalid result");
};
const active = (value: unknown): void => {
  const item = object(value);
  if (typeof item.playerId !== "string" || typeof item.playerName !== "string" || !optionalString(item, "teamName") || !timestamp(item.startedAt) || !finiteNonNegative(item.elapsedMsAtSnapshot)) invalid("invalid active attempt");
};
const sailTeam = (value: unknown): void => {
  const item = object(value);
  if (typeof item.teamId !== "string" || typeof item.teamName !== "string" || !finiteNonNegative(item.sailLogCount) || !finiteNonNegative(item.handoffCount) || !finiteNonNegative(item.completedLegCount) || !["racing", "finished", "unknown"].includes(item.status as "racing" | "finished" | "unknown") || !optionalString(item, "currentPlayerName") || !optionalString(item, "imageUrl") || !timestamp(item.startedAt) || !finiteNonNegative(item.elapsedMsAtSnapshot)) invalid("invalid sail team");
  if (item.status === "finished" && !timestamp(item.finishedAt)) invalid("finished sail team requires finishedAt");
  if ("finishedAt" in item && !timestamp(item.finishedAt)) invalid("invalid sail team");
};

export function parseCurrentHeatSnapshot(value: unknown): Snapshot {
  const root = object(value);
  if (root.schemaVersion !== 1 || !timestamp(root.generatedAt) || !timestamp(root.sourceFetchedAt)) invalid("invalid snapshot metadata");
  const heat = object(root.currentHeat);
  const activities = object(root.activities);
  const sail = object(activities.sail);
  const isUnknownSentinel = heat.id === "" && heat.number === 0 && heat.year === 0 && heat.date === "" && heat.state === "unknown" && heat.activeActivity === null && Object.keys(heat).length === 6;
  if (isUnknownSentinel) {
    // The publisher uses this one exact value while no heat is available.
  } else if (typeof heat.id !== "string" || typeof heat.number !== "number" || !finiteNonNegative(heat.number) || typeof heat.year !== "number" || !finiteNonNegative(heat.year) || !timestamp(heat.date) || !["running", "completed"].includes(heat.state as "running" | "completed") || !["beer", "spin", "sail", null].includes(heat.activeActivity as "beer" | "spin" | "sail" | null)) {
    invalid("invalid heat metadata");
  }
  for (const name of ["beer", "spin"] as const) {
    const activity = object(activities[name]);
    const completed = array(activity.completed);
    const inProgress = array(activity.active);
    completed.forEach(result);
    inProgress.forEach(active);
    if (!finiteNonNegative(activity.attemptsStarted) || !finiteNonNegative(activity.attemptsCompleted)) invalid("invalid activity");
  }
  if (!Array.isArray(sail["teams"] as unknown[])) invalid("invalid sail activity");
  (sail["teams"] as unknown[]).forEach(sailTeam);
  return root as unknown as Snapshot;
}
export function sailSlots(count: number, target = 16): boolean[] { const completed = Math.max(0, Math.min(target, Math.floor(count))); return Array.from({ length: target }, (_, index) => index < completed); }
export function isStaleSnapshot(generatedAt: string, now = new Date()): boolean { const published = Date.parse(generatedAt); return !Number.isFinite(published) || now.getTime() - published > 7 * 60_000; }
