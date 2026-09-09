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

type TeamComparisonSide = { year: number; comparison: TeamComparison | null; error?: string | null };

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

function initials(teamName: string): string {
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 2).map((word) => Array.from(word)[0] ?? "").join("").toUpperCase();
  return Array.from(words[0] ?? "").slice(0, 2).join("").toUpperCase() || "??";
}


function updateComparisonUrl(team1Year: number, team1Id: string, team2Year: number, team2Id: string): void {
  const params = new URLSearchParams();
  params.set("team1Year", String(team1Year));
  params.set("team2Year", String(team2Year));
  if (team1Id) params.set("team1", team1Id);
  if (team2Id) params.set("team2", team2Id);
  globalThis.history.replaceState(null, "", `${globalThis.location.pathname}?${params}`);
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

export function TeamPreviewCard({ team, variant }: { team: ComparisonTeam; variant: "one" | "two" }) {
  const teamInitials = initials(team.teamName);
  return (
    <article className={`${styles.teamPreviewCard} ${variant === "one" ? styles.teamPreviewOne : styles.teamPreviewTwo}`} aria-label={`${team.teamName} team preview`}>
      {team.imageUrl ? <img className={styles.teamPreviewImage} src={team.imageUrl} alt={`${team.teamName} logo`} /> : <span className={styles.teamPreviewImage} role="img" aria-label={`${team.teamName} initials ${teamInitials}`}>{teamInitials}</span>}
      <h2>{team.teamName}</h2>
      <p>{team.isOut ? "Inactive" : "Active"}</p>
      {team.players.length > 0 ? <ul aria-label={`${team.teamName} players`}>{team.players.map((player) => <li key={player.playerId}>{player.playerName}</li>)}</ul> : null}
    </article>
  );
}

export function TeamComparisonBoard({ initialTeamOne, initialTeamTwo, initialTeam1Id = "", initialTeam2Id = "", availableYears }: { initialTeamOne: TeamComparisonSide; initialTeamTwo: TeamComparisonSide; initialTeam1Id?: string; initialTeam2Id?: string; availableYears: readonly number[] }) {
  const [teamOneSide, setTeamOneSide] = useState(initialTeamOne);
  const [teamTwoSide, setTeamTwoSide] = useState(initialTeamTwo);
  const [team1Id, setTeam1Id] = useState(initialTeam1Id);
  const [team2Id, setTeam2Id] = useState(initialTeam2Id);
  const teamOneTeams = useMemo(() => [...(teamOneSide.comparison?.teams ?? [])].sort((a, b) => a.teamName.localeCompare(b.teamName)), [teamOneSide.comparison]);
  const teamTwoTeams = useMemo(() => [...(teamTwoSide.comparison?.teams ?? [])].sort((a, b) => a.teamName.localeCompare(b.teamName)), [teamTwoSide.comparison]);
  const team1 = teamOneTeams.find((team) => team.teamId === team1Id);
  const team2 = teamTwoTeams.find((team) => team.teamId === team2Id);

  useEffect(() => {
    let disposed = false;
    const refresh = async () => {
      const years = [...new Set([teamOneSide.year, teamTwoSide.year])];
      const results = await Promise.all(years.map(async (year) => {
        try {
          return [year, { comparison: await fetchTeamComparison(year), error: null }] as const;
        } catch (cause) {
          return [year, { comparison: null, error: cause instanceof Error ? cause.message : "Could not load team comparison" }] as const;
        }
      }));
      if (disposed) return;
      const byYear = new Map<number, Omit<TeamComparisonSide, "year">>();
      for (const [year, result] of results) byYear.set(year, result);
      setTeamOneSide((current) => current.year === teamOneSide.year ? { year: current.year, ...byYear.get(current.year)! } : current);
      setTeamTwoSide((current) => current.year === teamTwoSide.year ? { year: current.year, ...byYear.get(current.year)! } : current);
    };
    void refresh();
    const timer = globalThis.setInterval(() => { void refresh(); }, 60_000);
    return () => { disposed = true; globalThis.clearInterval(timer); };
  }, [teamOneSide.year, teamTwoSide.year]);

  const stale = [teamOneSide.comparison, teamTwoSide.comparison].some((comparison) => comparison && isStaleSnapshot(comparison.generatedAt));
  const available = Boolean(teamOneSide.comparison || teamTwoSide.comparison);
  const changeTeamOneYear = (year: number) => {
    setTeamOneSide({ year, comparison: null });
    setTeam1Id("");
    updateComparisonUrl(year, "", teamTwoSide.year, team2Id);
  };
  const changeTeamTwoYear = (year: number) => {
    setTeamTwoSide({ year, comparison: null });
    setTeam2Id("");
    updateComparisonUrl(teamOneSide.year, team1Id, year, "");
  };
  const changeTeamOne = (id: string) => {
    setTeam1Id(id);
    updateComparisonUrl(teamOneSide.year, id, teamTwoSide.year, team2Id);
  };
  const changeTeamTwo = (id: string) => {
    setTeam2Id(id);
    updateComparisonUrl(teamOneSide.year, team1Id, teamTwoSide.year, id);
  };

  return <main className={styles.main}><div className={styles.shell}><ActivityNav current="teams" /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · TEAM PERFORMANCE</p><h1>Teams</h1><p className={styles.description}>Compare average Beer, Sail, and Spin performance using Judge IT’s canonical scale.</p></div><div className={styles.status} role="status"><strong>{!available ? "Comparison unavailable" : stale ? "Stale comparison" : "Published comparison"}</strong><small>{!available ? teamOneSide.error || teamTwoSide.error || "No team data is available." : "Select a year and team for each side."}</small></div></header><section className={styles.comparisonPanel}><div className={styles.teamSelectors}><div className={styles.teamSelectorGroup}><label>Team 1 year<select value={teamOneSide.year} onChange={(event) => changeTeamOneYear(Number(event.target.value))}>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label>Team 1<select value={team1Id} onChange={(event) => changeTeamOne(event.target.value)}><option value="">Select Team 1</option>{teamOneTeams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamName}{team.isOut ? " (Inactive)" : ""}</option>)}</select></label></div><div className={styles.teamSelectorGroup}><label>Team 2 year<select value={teamTwoSide.year} onChange={(event) => changeTeamTwoYear(Number(event.target.value))}>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label>Team 2<select value={team2Id} onChange={(event) => changeTeamTwo(event.target.value)}><option value="">Select Team 2</option>{teamTwoTeams.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamName}{team.isOut ? " (Inactive)" : ""}</option>)}</select></label></div></div>{teamOneSide.error ? <p className={styles.error}>Team 1: {teamOneSide.error}</p> : null}{teamTwoSide.error ? <p className={styles.error}>Team 2: {teamTwoSide.error}</p> : null}<div className={styles.teamPreviewGrid}>{team1 ? <TeamPreviewCard team={team1} variant="one" /> : null}{team2 ? <TeamPreviewCard team={team2} variant="two" /> : null}</div><TeamRadarChart team1={team1} team2={team2} /><p className={styles.scaleNote}>100% is excellent: under 3s Beer, 8s Sail, or 5s Spin. 0% is poor: over 20s Beer, 30s Sail, or 20s Spin. Values are team averages.</p></section></div></main>;
}
