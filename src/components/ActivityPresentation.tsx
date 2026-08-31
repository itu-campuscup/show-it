import type { Ranking, RankingEntry } from "@/lib/ranking";
import type { Activity } from "@/lib/stats";
import styles from "@/app/page.module.css";

export const activityLabels: Record<Activity, string> = {
  beer: "Drink",
  spin: "Spin",
  sail: "Sail",
};

function ResultRows({ entries, activity }: { entries: RankingEntry[]; activity: Activity }) {
  return (
    <ol className={styles.rows} aria-label={`${activityLabels[activity]} rankings`}>
      {entries.map((entry) => (
        <li key={entry.playerId}>
          <span className={styles.rank} aria-label={`Rank ${entry.rank}`}>{entry.rank}</span>
          {entry.imageUrl ? <img className={styles.avatar} src={entry.imageUrl} alt="" /> : <span className={styles.avatar} aria-hidden="true" />}
          <div className={styles.rowPerson}>
            <strong>{entry.playerName}</strong>
            <small>{entry.teamName || "Team unavailable"} · Heat {entry.heatNumber}</small>
          </div>
          <b className={styles.resultValue}>
            {activity === "spin" ? <><span>{entry.displayLabel}</span><small>{entry.rpm === undefined ? "RPM unavailable" : `${Math.round(entry.rpm)} RPM`}</small></> : <><span>{entry.displayLabel}</span><small>{entry.formattedTime}</small></>}
          </b>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className={styles.emptyState}>{children}</p>;
}

export function ActivityPresentation({ activity, ranking }: { activity: Activity; ranking: Ranking | null }) {
  return (
    <section className={styles.activity} aria-labelledby={`${activity}-heading`}>
      <h2 id={`${activity}-heading`}>{activityLabels[activity]} rankings</h2>
      {ranking && ranking.entries.length > 0
        ? <ResultRows entries={ranking.entries} activity={activity} />
        : <EmptyState>{ranking ? `No ranked results for ${ranking.year}.` : "Rankings unavailable."}</EmptyState>}
    </section>
  );
}
