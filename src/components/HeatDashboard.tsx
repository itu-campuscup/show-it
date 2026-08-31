"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Snapshot } from "@/lib/snapshot";
import type { Activity } from "@/lib/stats";
import { activityLabels } from "./ActivityPresentation";
import styles from "@/app/page.module.css";

export const activityLinks: Array<{ activity: Activity; href: string }> = [
  { activity: "beer", href: "/drink" },
  { activity: "spin", href: "/spin" },
  { activity: "sail", href: "/sail" },
];

export function formatSnapshotTime(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function SnapshotStatus({ snapshot, error, stale = false }: { snapshot: Snapshot | null; error?: string | null; stale?: boolean }) {
  const label = !snapshot ? "Snapshot unavailable" : stale ? "Stale snapshot" : "Published snapshot";
  return <div className={styles.status} role="status" aria-live="polite"><strong>{label}</strong><small>{snapshot ? <>Source updated {formatSnapshotTime(snapshot.sourceFetchedAt)} · Published {formatSnapshotTime(snapshot.generatedAt)}{error ? ` · Refresh unavailable: ${error}` : ""}</> : error || "No spectator data is available right now."}</small></div>;
}

export function ActivityNav({ current }: { current?: Activity | "teams" }) {
  return <nav className={styles.nav} aria-label="Spectator views"><Link href="/" aria-current={current === undefined ? "page" : undefined}>Home</Link>{activityLinks.map(({ activity, href }) => <Link key={activity} href={href} aria-current={current === activity ? "page" : undefined}>{activityLabels[activity]}</Link>)}<Link href="/teams" aria-current={current === "teams" ? "page" : undefined}>Teams</Link></nav>;
}

function heatName(snapshot: Snapshot | null): string {
  if (!snapshot || snapshot.currentHeat.state === "unknown" || snapshot.currentHeat.number <= 0) return "Current heat unavailable";
  return `Heat ${snapshot.currentHeat.number}`;
}

function formatRaceTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


function CurrentHeatMatchup({ snapshot }: { snapshot: Snapshot | null }) {
  const teams = useMemo(() => snapshot?.activities.sail.teams.slice(0, 2) ?? [], [snapshot]);
  const winner = teams.find((team) => team.status === "finished");
  const runningElapsed = teams.reduce((longest, team) => Math.max(longest, team.elapsedMsAtSnapshot), 0);
  const finishedElapsed = winner?.finishedAt
    ? Date.parse(winner.finishedAt) - Math.min(...teams.map((team) => Date.parse(team.startedAt)))
    : null;
  const [elapsed, setElapsed] = useState(finishedElapsed ?? runningElapsed);

  useEffect(() => {
    setElapsed(finishedElapsed ?? runningElapsed);
    if (finishedElapsed !== null || !snapshot || teams.length === 0) return;
    const publishedAt = Date.parse(snapshot.generatedAt);
    const timer = globalThis.setInterval(() => setElapsed(runningElapsed + Math.max(0, Date.now() - publishedAt)), 1000);
    return () => globalThis.clearInterval(timer);
  }, [finishedElapsed, runningElapsed, snapshot, teams.length]);

  if (!snapshot || snapshot.currentHeat.state === "unknown") return <section className={styles.heatMatchup}><p className={styles.emptyState}>Current heat data is unavailable.</p></section>;

  return <section className={styles.heatMatchup} aria-label={`Heat ${snapshot.currentHeat.number} matchup`}><div className={styles.matchupGrid}>{[0, 1].map((index) => {
    const team = teams[index];
    if (!team) return <article className={styles.matchupTeam} key={index}><div className={styles.matchupAvatar} aria-hidden="true" /><h2>Waiting for team</h2><p>Current sailor unavailable</p></article>;
    const isWinner = winner?.teamId === team.teamId;
    return <article className={styles.matchupTeam} key={team.teamId}>{isWinner ? <strong className={styles.winnerBadge}>Winner</strong> : null}{team.imageUrl ? <img className={styles.matchupAvatar} src={team.imageUrl} alt="" /> : <div className={styles.matchupAvatar} aria-hidden="true" />}<h2>{team.teamName}</h2><p>{team.currentPlayerName ? `Current sailor: ${team.currentPlayerName}` : "Current sailor unavailable"}</p></article>;
  })}<div className={styles.matchupTimer}><strong>{formatRaceTime(elapsed)}</strong><span>{winner ? "Final time" : "Race time"}</span></div></div></section>;
}

export function HeatDashboard({ initialSnapshot, initialError }: { initialSnapshot: Snapshot | null; initialError?: string | null }) {
  const snapshot = initialSnapshot;
  return <main className={styles.main}><div className={styles.shell}><ActivityNav /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · CURRENT HEAT</p><h1>{heatName(snapshot)}</h1><p className={styles.description}>Live race status from the published Judge IT snapshot.</p></div><SnapshotStatus snapshot={snapshot} error={initialError} /></header><CurrentHeatMatchup snapshot={snapshot} /><section className={styles.linkPanel} aria-labelledby="views-heading"><h2 id="views-heading">Explore CampusCup</h2><div className={styles.linkList}>{activityLinks.map(({ activity, href }) => <Link key={activity} href={href}>{activityLabels[activity]} rankings <span aria-hidden="true">→</span></Link>)}<Link href="/teams">Team comparison <span aria-hidden="true">→</span></Link></div></section></div></main>;
}
