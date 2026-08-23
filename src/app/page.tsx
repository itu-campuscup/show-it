"use client";

import { useEffect, useMemo, useState } from "react";
import { buildHeatProgress, formatDuration, type RecordLike } from "@/lib/progress";
import styles from "./page.module.css";

type Data = { players: RecordLike[]; teams: RecordLike[]; heats: RecordLike[]; timeTypes: RecordLike[]; timeLogs: RecordLike[] };
const empty: Data = { players: [], teams: [], heats: [], timeTypes: [], timeLogs: [] };

async function query<T>(name: string): Promise<T> {
  const base = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!base) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  const response = await fetch(`${base.replace(/\/$/, "")}/api/query`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: `queries:${name}`, args: {} }),
  });
  if (!response.ok) throw new Error(`Could not load ${name}`);
  const payload = await response.json();
  return payload.value as T;
}

function Activity({ title, icon, activity, kind }: { title: string; icon: string; activity: ReturnType<typeof buildHeatProgress>["activities"]["beer"]; kind: "beer" | "spin" | "sail" }) {
  const rows = kind === "sail"
    ? Object.entries(activity.sailCountByTeam).map(([teamId, count]) => ({ teamId, count, player: activity.currentPlayerByTeam[teamId] ?? "Waiting", teamName: activity.teamNameByTeam[teamId] ?? "Unknown team" }))
    : activity.completed.slice(0, 5).map((entry) => ({ ...entry, value: kind === "spin" ? `${Math.round(entry.rpm ?? 0)} RPM` : formatDuration(entry.durationMs) }));
  return <section className={styles.activity}>
    <h2>{icon} {title}</h2>
    {rows.length === 0 ? <p className={styles.muted}>No progress yet.</p> : <ol className={styles.rows}>{rows.map((row, index) => <li key={`${row.teamId}-${index}`}>
      <span className={styles.rank}>{index + 1}</span><div><strong>{"playerName" in row ? row.playerName : row.player}</strong><small>{row.teamName}</small></div>
      <b>{"count" in row ? `${row.count}/16` : row.value}</b>
    </li>)}</ol>}
    {kind !== "sail" && Object.values(activity.activeByTeam).length > 0 && <p className={styles.live}>● Live: {Object.values(activity.activeByTeam).join(", ")}</p>}
  </section>;
}

export default function Home() {
  const [data, setData] = useState<Data>(empty); const [error, setError] = useState<string | null>(null); const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => { let active = true; const load = async () => { try { const [players, teams, heats, timeTypes, timeLogs] = await Promise.all([query<RecordLike[]>("getPlayers"), query<RecordLike[]>("getTeams"), query<RecordLike[]>("getHeats"), query<RecordLike[]>("getTimeTypes"), query<RecordLike[]>("getTimeLogs")]); if (active) { setData({ players, teams, heats, timeTypes, timeLogs }); setError(null); setUpdatedAt(new Date()); } } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Could not load live progress"); } }; load(); const timer = window.setInterval(load, 3_000); return () => { active = false; window.clearInterval(timer); }; }, []);
  const currentHeat = data.heats.find((heat) => heat.is_current === true) ?? null;
  const progress = useMemo(() => buildHeatProgress({ ...data, currentHeat }), [data, currentHeat]);
  return <main className={styles.main}><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · LIVE</p><h1>{currentHeat ? `Heat ${progress.heatNumber}` : "Waiting for next heat"}</h1></div><div className={styles.status}><span>● LIVE</span><small>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : "Connecting…"}</small></div></header>
    {error ? <div className={styles.error}>{error}. Add the public Convex URL and allow this site’s origin in Convex.</div> : <><div className={styles.summary}><div><b>{data.teams.length}</b><span>teams</span></div><div><b>{data.timeLogs.filter((log) => String(log.heat_id ?? "") === String(currentHeat?._id ?? currentHeat?.id ?? "")).length}</b><span>events logged</span></div><div><b>16</b><span>sails to win</span></div></div><div className={styles.grid}><Activity title="Drinking" icon="🍺" activity={progress.activities.beer} kind="beer"/><Activity title="Spinning" icon="🌪️" activity={progress.activities.spin} kind="spin"/><Activity title="Sailing" icon="⛵" activity={progress.activities.sail} kind="sail"/></div></>}
  </main>;
}
