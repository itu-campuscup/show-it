"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchLatestRanking } from "@/lib/rankingSource";
import type { Ranking } from "@/lib/ranking";
import { isStaleSnapshot } from "@/lib/snapshot";
import type { Activity } from "@/lib/stats";
import { ActivityPresentation, activityLabels } from "./ActivityPresentation";
import { ActivityNav, formatSnapshotTime } from "./HeatDashboard";
import styles from "@/app/page.module.css";

export const RANKING_REFRESH_INTERVAL_MS = 60_000;

type RankingLoader = (signal: AbortSignal) => Promise<Ranking>;
export type RankingRefreshTimer = number;
export type RankingRefreshOptions = {
  initialRanking: Ranking | null;
  load: RankingLoader;
  onRanking: (ranking: Ranking) => void;
  onError: (error: unknown) => void;
  setInterval?: (callback: () => void, delay: number) => RankingRefreshTimer;
  clearInterval?: (id: RankingRefreshTimer) => void;
};

export function createRankingRefresh(options: RankingRefreshOptions) {
  let current = options.initialRanking;
  let disposed = false;
  let requestController: AbortController | undefined;
  const setInterval = options.setInterval ?? globalThis.setInterval;
  const clearInterval = options.clearInterval ?? globalThis.clearInterval;

  const refresh = async (): Promise<void> => {
    if (disposed) return;
    requestController?.abort();
    const controller = new AbortController();
    requestController = controller;
    try {
      const next = await options.load(controller.signal);
      if (disposed || controller.signal.aborted || requestController !== controller) return;
      const currentTime = current ? Date.parse(current.generatedAt) : Number.NEGATIVE_INFINITY;
      const nextTime = Date.parse(next.generatedAt);
      if (Number.isFinite(nextTime) && nextTime > currentTime) {
        current = next;
        options.onRanking(next);
      }
    } catch (error) {
      if (!disposed && !controller.signal.aborted && requestController === controller) options.onError(error);
    } finally {
      if (requestController === controller) requestController = undefined;
    }
  };

  const timer = setInterval(() => { void refresh(); }, RANKING_REFRESH_INTERVAL_MS);
  return {
    refresh,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      requestController?.abort();
      requestController = undefined;
      clearInterval(timer);
    },
    get current() { return current; },
  };
}

function RankingStatus({ ranking, error, stale }: { ranking: Ranking | null; error: string | null; stale: boolean }) {
  const label = !ranking ? "Rankings unavailable" : stale ? "Stale rankings" : "Published rankings";
  return <div className={styles.status} role="status" aria-live="polite"><strong>{label}</strong><small>{ranking ? <>Updated {formatSnapshotTime(ranking.generatedAt)}{error ? ` · Refresh unavailable: ${error}` : ""}</> : error || "No ranking data is available right now."}</small></div>;
}

export function SpectatorBoard({ activity, initialRanking, initialError }: { activity: Activity; initialRanking: Ranking | null; initialError?: string | null }) {
  const [ranking, setRanking] = useState<Ranking | null>(initialRanking);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const source = useMemo(() => ({ load: (signal: AbortSignal) => fetchLatestRanking(activity, undefined, signal) }), [activity]);

  useEffect(() => {
    const refresh = createRankingRefresh({
      initialRanking,
      load: source.load,
      onRanking: (next) => { setRanking(next); setError(null); },
      onError: (cause) => setError(cause instanceof Error ? cause.message : "Could not load rankings"),
    });
    void refresh.refresh();
    return refresh.dispose;
  }, [initialRanking, source]);

  const stale = ranking ? isStaleSnapshot(ranking.generatedAt) : false;
  const year = ranking?.year;
  return <main className={styles.main}><div className={styles.shell}><ActivityNav current={activity} /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · PUBLISHED RANKINGS</p><h1>{activityLabels[activity]}</h1><p className={styles.description}>{year ? `${year} rankings across all heats.` : "Rankings across all heats."}</p></div><RankingStatus ranking={ranking} error={error} stale={stale} /></header><ActivityPresentation activity={activity} ranking={ranking} /></div></main>;
}
