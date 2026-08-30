"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchCurrentHeatSnapshot } from "@/lib/snapshotSource";
import { isStaleSnapshot, type Snapshot } from "@/lib/snapshot";
import type { Activity } from "@/lib/stats";
import { ActivityPresentation, activityLabels } from "./ActivityPresentation";
import { ActivityNav, SnapshotStatus } from "./HeatDashboard";
import styles from "@/app/page.module.css";

export const SNAPSHOT_REFRESH_INTERVAL_MS = 60_000;

type SnapshotLoader = (signal: AbortSignal) => Promise<Snapshot>;
export type SnapshotRefreshTimer = number;
export type SnapshotRefreshOptions = {
  initialSnapshot: Snapshot | null;
  load: SnapshotLoader;
  onSnapshot: (snapshot: Snapshot) => void;
  onError: (error: unknown) => void;
  setInterval?: (callback: () => void, delay: number) => SnapshotRefreshTimer;
  clearInterval?: (id: SnapshotRefreshTimer) => void;
};

export function createSnapshotRefresh(options: SnapshotRefreshOptions) {
  let current = options.initialSnapshot;
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
        options.onSnapshot(next);
      }
    } catch (error) {
      if (!disposed && !controller.signal.aborted && requestController === controller) options.onError(error);
    } finally {
      if (requestController === controller) requestController = undefined;
    }
  };

  const timer = setInterval(() => { void refresh(); }, SNAPSHOT_REFRESH_INTERVAL_MS);
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

export function SpectatorBoard({ activity, initialSnapshot, initialError }: { activity: Activity; initialSnapshot: Snapshot | null; initialError?: string | null }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initialSnapshot);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const source = useMemo(() => ({ load: (signal: AbortSignal) => fetchCurrentHeatSnapshot(undefined, signal) }), []);

  useEffect(() => {
    const refresh = createSnapshotRefresh({
      initialSnapshot,
      load: source.load,
      onSnapshot: (next) => { setSnapshot(next); setError(null); },
      onError: (cause) => setError(cause instanceof Error ? cause.message : "Could not load spectator snapshot"),
    });
    return refresh.dispose;
  }, [initialSnapshot, source]);

  const stale = snapshot ? isStaleSnapshot(snapshot.generatedAt) : false;
  return <main className={styles.main}><div className={styles.shell}><ActivityNav current={activity} /><header className={styles.header}><div><p className={styles.kicker}>CAMPUSCUP · PUBLISHED SPECTATOR SNAPSHOT</p><h1>{activityLabels[activity]}</h1><p className={styles.description}>{activity === "sail" ? "Relay race status for the current heat." : `${activityLabels[activity]} results and current attempts for the published heat.`}</p></div><SnapshotStatus snapshot={snapshot} error={error} stale={stale} /></header><section className={styles.heatContext} aria-label="Heat context"><strong>{snapshot && snapshot.currentHeat.state !== "unknown" ? `Heat ${snapshot.currentHeat.number}` : "Heat unavailable"}</strong><span>{snapshot?.currentHeat.activeActivity ? `Current activity: ${activityLabels[snapshot.currentHeat.activeActivity]}` : "Current activity unavailable"}</span></section><ActivityPresentation activity={activity} snapshot={snapshot} /></div></main>;
}
