import Link from "next/link";
import type { ChampionRankings } from "@/lib/championSelection";
import type { Activity } from "@/lib/stats";
import { activityLabels } from "./ActivityPresentation";
import { ActivityNav } from "./HeatDashboard";
import styles from "@/app/page.module.css";

const championActivities: Array<{ activity: Activity; label: string; href: string }> = [
  { activity: "beer", label: "Beer", href: "/drink" },
  { activity: "sail", label: "Sail", href: "/sail" },
  { activity: "spin", label: "Spin", href: "/spin" },
];


export function ChampionDashboard({ champions, error }: { champions: ChampionRankings | null; error?: string | null }) {
  if (!champions) {
    return <main className={styles.main}><div className={styles.shell}><ActivityNav /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · CHAMPIONS</p><h1>Champions unavailable</h1><p className={styles.description}>{error || "No published year contains complete Beer, Sail, and Spin rankings."}</p></div></header></div></main>;
  }

  return <main className={styles.main}><div className={styles.shell}><ActivityNav /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · {champions.year} CHAMPIONS</p><h1>The best of {champions.year}</h1><p className={styles.description}>Top individual result in each discipline from published Judge IT rankings.</p></div><div className={styles.status} role="status"><strong>Published champions</strong><small>Updated {new Date(champions.rankings.beer.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div></header><section className={styles.championGrid} aria-label={`${champions.year} champions`}>{championActivities.map(({ activity, label, href }) => {
    const winner = champions.rankings[activity].entries[0]!;
    const result = activity === "spin" ? winner.displayRpmLabel || winner.displayLabel : winner.formattedTime;
    const winnerInitials = winner.playerName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => Array.from(word)[0] ?? "").join("").toUpperCase() || "??";
    return <Link className={styles.championCard} href={`${href}?year=${champions.year}`} key={activity}><p>{label} champion</p>{winner.imageUrl ? <img className={styles.championAvatar} src={winner.imageUrl} alt="" /> : <span className={styles.championAvatar} aria-hidden="true">{winnerInitials}</span>}<h2>{winner.playerName}</h2><small>{winner.teamName} · Heat {winner.heatNumber}</small><strong>{result}</strong><span>View {activityLabels[activity]} rankings →</span></Link>;
  })}</section></div></main>;
}
