# Current heat snapshot contract

`judge-it-stats` must publish `current-heat.json` atomically after fetching the authenticated schema-backed `/stats` feed. Show IT consumes this public projection only. It must never use the Convex URL or `STATS_API_KEY`.

```ts
{
  schemaVersion: 1,
  generatedAt: string,
  sourceFetchedAt: string,
  currentHeat: { id: string, number: number, year: number, date: string, state: "running" | "completed" | "unknown" },
  activities: {
    beer: { completed: Result[], active: ActiveAttempt[], attemptsStarted: number, attemptsCompleted: number },
    spin: { completed: Result[], active: ActiveAttempt[], attemptsStarted: number, attemptsCompleted: number },
    sail: { teams: SailTeam[] }
  }
}
```

Beer and Spin pair logs by `(player_id, heat_id, time_type_id)`. Sail must reproduce Judge IT relay semantics: its first log starts a team, each handoff writes the previous and next player together, and a finished team reaches 16 Sail logs. The producer must publish deterministic event ordering or derive `currentPlayerName` itself. Show IT must not infer it from equal formatted timestamps.
