"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currentHeatRankingPath, statsBaseUrl, type Activity } from "@/lib/stats";
import styles from "@/app/page.module.css";

type CurrentHeat = { heat: number; date: string } | null;
type Index = { lastUpdated: string; currentHeat: CurrentHeat; years: number[] };
type Entry = { rank: number; playerName: string; teamName: string; formattedTime: string; displayLabel: string; rpm?: number; displayRpmLabel?: string; imageUrl?: string };
type Rankings = { generatedAt: string; rankings: Entry[] };

const details: Record<Activity, { title: string; icon: string; description: string }> = {
  beer: { title: "Drink", icon: "🍺", description: "Fastest Beer times in the current heat." },
  spin: { title: "Spin", icon: "🌪️", description: "Highest RPM in the current heat. Ten revolutions per attempt." },
  sail: { title: "Sail", icon: "⛵", description: "Fastest Sail times in the current heat." },
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Stats source returned ${response.status}`);
  return response.json() as Promise<T>;
}

export function SpectatorPage({ activity }: { activity: Activity }) {
  const [index, setIndex] = useState<Index | null>(null);
  const [rankings, setRankings] = useState<Rankings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const source = useMemo(() => statsBaseUrl(process.env.NEXT_PUBLIC_STATS_BASE_URL), []);
  const copy = details[activity];

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const nextIndex = await getJson<Index>(`${source}/index.json`);
        if (!nextIndex.currentHeat) throw new Error("No current heat has been published yet");
        const year = new Date(nextIndex.currentHeat.date).getFullYear();
        const nextRankings = await getJson<Rankings>(currentHeatRankingPath(source, year, nextIndex.currentHeat.heat, activity));
        if (active) { setIndex(nextIndex); setRankings(nextRankings); setError(null); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Could not load spectator stats"); }
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [activity, source]);

  return <main className={styles.main}>
    <nav className={styles.nav} aria-label="Activities"><Link href="/drink">🍺 Drink</Link><Link href="/spin">🌪️ Spin</Link><Link href="/sail">⛵ Sail</Link></nav>
    <header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · SPECTATOR VIEW</p><h1>{copy.icon} {copy.title}</h1><p className={styles.description}>{copy.description}</p></div><div className={styles.status}><span>● REFRESHES EVERY 5 MIN</span><small>{index ? `Heat ${index.currentHeat?.heat} · data updated ${new Date(index.lastUpdated).toLocaleTimeString()}` : "Loading latest published heat…"}</small></div></header>
    {error ? <section className={styles.error}><strong>Stats are not published yet.</strong><br />{error}. The `judge-it-stats` GitHub Pages deployment must be enabled before Show IT can display live results.</section> : !rankings ? <p className={styles.loading}>Loading results…</p> : <section className={styles.activity}><h2>Current heat leaderboard</h2>{rankings.rankings.length === 0 ? <p className={styles.muted}>No completed {copy.title.toLowerCase()} attempts logged yet.</p> : <ol className={styles.rows}>{rankings.rankings.map((entry) => <li key={`${entry.rank}-${entry.playerName}`}><span className={styles.rank}>{entry.rank}</span>{entry.imageUrl ? <img className={styles.avatar} src={entry.imageUrl} alt="" /> : <span className={styles.avatar} aria-hidden="true" />}<div><strong>{entry.playerName}</strong><small>{entry.teamName || "Team unavailable"}</small></div><b>{activity === "spin" ? entry.displayRpmLabel : entry.displayLabel}</b></li>)}</ol>}</section>}
  </main>;
}
