"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComparisonTeam, RadarMetric, TeamComparison } from "@/lib/teamComparison";
import { fetchTeamComparison } from "@/lib/teamComparisonSource";
import { isStaleSnapshot } from "@/lib/snapshot";
import { ActivityNav, formatSnapshotTime } from "./HeatDashboard";
import styles from "@/app/page.module.css";

const subjects: RadarMetric["subject"][] = ["Beer", "Sail", "Spin"];
const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
const center = { x: 200, y: 170 };
const radius = 120;

function point(angle: number, distance: number): string {
  return `${center.x + Math.cos(angle) * distance},${center.y + Math.sin(angle) * distance}`;
}

function performance(team: ComparisonTeam | undefined, subject: RadarMetric["subject"]): number {
  return team?.radarData.find((metric) => metric.subject === subject)?.performance ?? 0;
}

function polygon(team: ComparisonTeam): string {
  return subjects.map((subject, index) => point(angles[index], radius * performance(team, subject) / 100)).join(" ");
}

function summary(team: ComparisonTeam): string {
  return `${team.teamName} performance: ${subjects.map((subject) => `${subject} ${performance(team, subject)}%`).join(", ")}`;
}

export function TeamRadarChart({ team1, team2 }: { team1?: ComparisonTeam; team2?: ComparisonTeam }) {
  return (
    <div className={styles.radarWrap}>
      <svg className={styles.radar} viewBox="0 0 400 340" role="img" aria-label={team1 && team2 ? `${summary(team1)}. ${summary(team2)}.` : "Select two teams to compare Beer, Sail, and Spin performance"}>
        {[25, 50, 75, 100].map((level) => <polygon key={level} className={styles.radarGrid} points={angles.map((angle) => point(angle, radius * level / 100)).join(" ")} />)}
        {angles.map((angle, index) => <line key={subjects[index]} className={styles.radarAxis} x1={center.x} y1={center.y} x2={center.x + Math.cos(angle) * radius} y2={center.y + Math.sin(angle) * radius} />)}
        {team1 ? <polygon className={styles.radarTeamOne} points={polygon(team1)} /> : null}
        {team2 ? <polygon className={styles.radarTeamTwo} points={polygon(team2)} /> : null}
        <text className={styles.radarLabel} x="200" y="25" textAnchor="middle">Beer</text>
        <text className={styles.radarLabel} x="352" y="245" textAnchor="end">Sail</text>
        <text className={styles.radarLabel} x="48" y="245">Spin</text>
      </svg>
      {team1 && team2 ? <div className={styles.radarLegend}><span><i className={styles.teamOneSwatch} />{team1.teamName}</span><span><i className={styles.teamTwoSwatch} />{team2.teamName}</span></div> : <p className={styles.emptyState}>Select two teams to compare their average performance.</p>}
    </div>
  );
}

export function TeamComparisonBoard({ initialComparison, initialError }: { initialComparison: TeamComparison | null; initialError?: string | null }) {
  const [comparison, setComparison] = useState(initialComparison);
  const [error, setError] = useState(initialError ?? null);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const teams = useMemo(() => [...(comparison?.teams ?? [])].filter((team) => !team.isOut).sort((a, b) => a.teamName.localeCompare(b.teamName)), [comparison]);
  const team1 = teams.find((team) => team.teamId === team1Id);
  const team2 = teams.find((team) => team.teamId === team2Id);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const next = await fetchTeamComparison(undefined, controller.signal);
        if (disposed || controller.signal.aborted) return;
        setComparison((current) => !current || Date.parse(next.generatedAt) > Date.parse(current.generatedAt) ? next : current);
        setError(null);
      } catch (cause) {
        if (!disposed && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load team comparison");
      }
    };
    void refresh();
    const timer = globalThis.setInterval(() => { void refresh(); }, 60_000);
    return () => { disposed = true; controller?.abort(); globalThis.clearInterval(timer); };
  }, []);

  const stale = comparison ? isStaleSnapshot(comparison.generatedAt) : false;
  return <main className={styles.main}><div className={styles.shell}><ActivityNav current="teams" /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · TEAM PERFORMANCE</p><h1>Teams</h1><p className={styles.description}>Compare average Beer, Sail, and Spin performance using Judge IT’s canonical scale.</p></div><div className={styles.status} role="status"><strong>{!comparison ? "Comparison unavailable" : stale ? "Stale comparison" : "Published comparison"}</strong><small>{comparison ? `Updated ${formatSnapshotTime(comparison.generatedAt)}` : error || "No team data is available."}</small></div></header><section className={styles.comparisonPanel}><div className={styles.teamSelectors}><label>Team 1<select value={team1Id} onChange={(event) => setTeam1Id(event.target.value)}><option value="">Select Team 1</option>{teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamName}</option>)}</select></label><label>Team 2<select value={team2Id} onChange={(event) => setTeam2Id(event.target.value)}><option value="">Select Team 2</option>{teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamName}</option>)}</select></label></div>{error && comparison ? <p className={styles.error}>{error}</p> : null}<TeamRadarChart team1={team1} team2={team2} /><p className={styles.scaleNote}>100% is excellent: under 3s Beer, 8s Sail, or 5s Spin. 0% is poor: over 20s Beer, 30s Sail, or 20s Spin. Values are team averages.</p></section></div></main>;
}
