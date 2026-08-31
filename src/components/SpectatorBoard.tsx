"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRanking } from "@/lib/rankingSource";
import type { Ranking } from "@/lib/ranking";
import { isStaleSnapshot } from "@/lib/snapshot";
import type { Activity } from "@/lib/stats";
import { ActivityPresentation, activityLabels } from "./ActivityPresentation";
import { YearSelector } from "./YearSelector";
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

export type SpectatorBoardProps = {
  activity: Activity;
  initialRanking: Ranking | null;
  availableYears: readonly number[];
  selectedYear: number;
  initialError?: string | null;
};

export function SpectatorBoard({ activity, initialRanking, availableYears, selectedYear, initialError }: SpectatorBoardProps) {
  const startingRanking = initialRanking?.year === selectedYear ? initialRanking : null;
  const [ranking, setRanking] = useState<Ranking | null>(startingRanking);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const source = useMemo(() => ({ load: (signal: AbortSignal) => fetchRanking(activity, selectedYear, undefined, signal) }), [activity, selectedYear]);

  useEffect(() => {
    setRanking(startingRanking);
    setError(initialError ?? null);
    const refresh = createRankingRefresh({
      initialRanking: startingRanking,
      load: source.load,
      onRanking: (next) => {
        if (next.year !== selectedYear) return;
        setRanking(next);
        setError(null);
      },
      onError: (cause) => setError(cause instanceof Error ? cause.message : "Could not load rankings"),
    });
    void refresh.refresh();
    return refresh.dispose;
  }, [initialError, selectedYear, source, source.load, startingRanking]);

  const visibleRanking = ranking?.year === selectedYear ? ranking : startingRanking;
  const stale = visibleRanking ? isStaleSnapshot(visibleRanking.generatedAt) : false;
  return <main className={styles.main}><div className={styles.shell}><ActivityNav current={activity} /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · PUBLISHED RANKINGS</p><h1>{activityLabels[activity]}</h1><p className={styles.description}>{selectedYear} rankings across all heats.</p><YearSelector key={selectedYear} availableYears={availableYears} selectedYear={selectedYear} /></div><RankingStatus ranking={visibleRanking} error={error} stale={stale} /></header><ActivityPresentation activity={activity} ranking={visibleRanking} /></div></main>;
}
