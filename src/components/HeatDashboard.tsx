import Link from "next/link";
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

export function ActivityNav({ current }: { current?: Activity }) {
  return <nav className={styles.nav} aria-label="Spectator views"><Link href="/" aria-current={current === undefined ? "page" : undefined}>Home</Link>{activityLinks.map(({ activity, href }) => <Link key={activity} href={href} aria-current={current === activity ? "page" : undefined}>{activityLabels[activity]}</Link>)}</nav>;
}

function heatName(snapshot: Snapshot | null): string {
  if (!snapshot || snapshot.currentHeat.state === "unknown" || snapshot.currentHeat.number <= 0) return "Current heat unavailable";
  return `Heat ${snapshot.currentHeat.number}`;
}

function activityName(snapshot: Snapshot | null): string {
  const active = snapshot?.currentHeat.activeActivity;
  return active ? activityLabels[active] : "No activity currently active";
}

function SummaryCard({ label, value, href }: { label: string; value: string; href: string }) {
  return <Link className={styles.summaryCard} href={href}><span>{label}</span><strong>{value}</strong><small>View details</small></Link>;
}

export function HeatDashboard({ initialSnapshot, initialError }: { initialSnapshot: Snapshot | null; initialError?: string | null }) {
  const snapshot = initialSnapshot;
  const summaries = [
    { label: "Drink completed", value: snapshot ? (snapshot.activities.beer.attemptsCompleted > 0 ? `${snapshot.activities.beer.attemptsCompleted}` : "No results") : "Unavailable", href: "/drink" },
    { label: "Spin completed", value: snapshot ? (snapshot.activities.spin.attemptsCompleted > 0 ? `${snapshot.activities.spin.attemptsCompleted}` : "No results") : "Unavailable", href: "/spin" },
    { label: "Sail teams racing", value: snapshot ? (snapshot.activities.sail.teams.length > 0 ? `${snapshot.activities.sail.teams.length}` : "No teams") : "Unavailable", href: "/sail" },
  ] as const;
  return <main className={styles.main}><div className={styles.shell}><ActivityNav /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · SPECTATOR COMMAND CENTRE</p><h1>{heatName(snapshot)}</h1><p className={styles.description}>A published view of the current CampusCup heat for spectators.</p></div><SnapshotStatus snapshot={snapshot} error={initialError} /></header><section className={styles.currentActivity} aria-labelledby="current-activity-heading"><span className={styles.eyebrow}>Current activity</span><h2 id="current-activity-heading">{activityName(snapshot)}</h2><p>{snapshot?.currentHeat.state === "completed" ? "This heat is complete." : snapshot?.currentHeat.state === "running" ? "Follow the activity currently being run." : "The current activity is unavailable."}</p></section><section className={styles.summary} aria-label="Heat summaries">{summaries.map((summary) => <SummaryCard key={summary.label} {...summary} />)}</section><section className={styles.linkPanel} aria-labelledby="views-heading"><h2 id="views-heading">Explore activity results</h2><div className={styles.linkList}>{activityLinks.map(({ activity, href }) => <Link key={activity} href={href}>{activityLabels[activity]} results <span aria-hidden="true">→</span></Link>)}</div></section></div></main>;
}
