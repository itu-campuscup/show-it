import type { Result, Snapshot } from "@/lib/snapshot";
import type { Activity } from "@/lib/stats";
import styles from "@/app/page.module.css";

export const activityLabels: Record<Activity, string> = {
  beer: "Drink",
  spin: "Spin",
  sail: "Sail",
};

function ResultRows({ entries, activity }: { entries: Result[]; activity: "beer" | "spin" }) {
  return (
    <ol className={styles.rows} aria-label={`${activityLabels[activity]} completed results`}>
      {entries.map((entry) => (
        <li key={entry.id}>
          <span className={styles.rank} aria-label={`Rank ${entry.rank}`}>{entry.rank}</span>
          {entry.imageUrl ? <img className={styles.avatar} src={entry.imageUrl} alt="" /> : <span className={styles.avatar} aria-hidden="true" />}
          <div className={styles.rowPerson}>
            <strong>{entry.playerName}</strong>
            <small>{entry.teamName || "Team unavailable"}</small>
          </div>
          <b className={styles.resultValue}>
            {activity === "spin" ? <><span>{entry.displayRpmLabel || "RPM unavailable"}</span><small>{entry.rpm === undefined ? "RPM unavailable" : `${Math.round(entry.rpm)} RPM`}</small></> : <><span>{entry.displayLabel}</span><small>{entry.formattedTime}</small></>}
          </b>
        </li>
      ))}
    </ol>
  );
}

function EmptyState({ children }: { children: string }) {
  return <p className={styles.emptyState}>{children}</p>;
}

function TimedActivity({ activity, snapshot }: { activity: "beer" | "spin"; snapshot: Snapshot }) {
  const data = snapshot.activities[activity];
  return (
    <div className={styles.activitySections}>
      <section aria-labelledby={`${activity}-completed-heading`}>
        <h2 id={`${activity}-completed-heading`}>Completed results</h2>
        {data.completed.length > 0 ? <ResultRows entries={data.completed} activity={activity} /> : <EmptyState>No completed results in this snapshot.</EmptyState>}
      </section>
      <section className={styles.subsection} aria-labelledby={`${activity}-active-heading`}>
        <h2 id={`${activity}-active-heading`}>Current attempts</h2>
        {data.active.length > 0 ? <ul className={styles.active} aria-label={`${activityLabels[activity]} current attempts`}>{data.active.map((attempt) => <li key={attempt.playerId}><strong>{attempt.playerName}</strong><small>{attempt.teamName || "Team unavailable"}</small></li>)}</ul> : <EmptyState>No current attempts in this snapshot.</EmptyState>}
      </section>
    </div>
  );
}

function SailPresentation({ snapshot }: { snapshot: Snapshot }) {
  const teams = snapshot.activities.sail.teams;
  return (
    <section className={styles.raceBoard} aria-labelledby="sail-race-heading">
      <div className={styles.sectionHeading}>
        <h2 id="sail-race-heading">Relay race</h2>
        <p>Team status from the published spectator snapshot.</p>
      </div>
      {teams.length === 0 ? <EmptyState>No Sail race data in this snapshot.</EmptyState> : <div className={styles.raceTeams}>{teams.map((team) => {
        const state = team.status === "finished" ? "Finished winner" : team.status === "racing" ? "Racing" : "Race status unavailable";
        return <article className={styles.raceTeam} key={team.teamId}>
          <div className={styles.raceHeader}>
            {team.imageUrl ? <img className={styles.avatar} src={team.imageUrl} alt="" /> : <span className={styles.avatar} aria-hidden="true" />}
            <div><h3>{team.teamName}</h3><small>{team.status === "racing" ? (team.currentPlayerName ? `Current sailor: ${team.currentPlayerName}` : "Current sailor unavailable") : state}</small></div>
            <strong className={team.status === "finished" ? styles.winner : styles.raceState}>{state}</strong>
          </div>
        </article>;
      })}</div>}
    </section>
  );
}

export function ActivityPresentation({ activity, snapshot }: { activity: Activity; snapshot: Snapshot | null }) {
  if (!snapshot) return <section className={styles.activity} aria-live="polite"><h2>{activityLabels[activity]} data</h2><EmptyState>Activity data unavailable until a snapshot is published.</EmptyState></section>;
  if (activity === "sail") return <SailPresentation snapshot={snapshot} />;
  return <section className={styles.activity} aria-labelledby={`${activity}-heading`}><h2 id={`${activity}-heading`}>{activityLabels[activity]} results</h2><TimedActivity activity={activity} snapshot={snapshot} /></section>;
}
