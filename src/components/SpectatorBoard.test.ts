import { afterEach, describe, expect, test } from "bun:test";
import { createSnapshotRefresh, type SnapshotRefreshOptions } from "./SpectatorBoard";
import type { Snapshot } from "@/lib/snapshot";

const snapshot = (generatedAt: string): Snapshot => ({ generatedAt } as Snapshot);
const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

afterEach(() => {
  globalThis.setInterval = originalSetInterval;
  globalThis.clearInterval = originalClearInterval;
});

function refreshOptions(overrides: Partial<SnapshotRefreshOptions>): SnapshotRefreshOptions {
  return {
    initialSnapshot: snapshot("2026-05-17T12:00:00.000Z"),
    load: async () => snapshot("2026-05-17T12:01:00.000Z"),
    onSnapshot: () => {},
    onError: () => {},
    ...overrides,
  };
}

describe("spectator snapshot refresh boundary", () => {
  test("replaces the initial snapshot only with a newer valid snapshot", async () => {
    const received: Snapshot[] = [];
    const refresh = createSnapshotRefresh(refreshOptions({ onSnapshot: (next) => received.push(next) }));

    await refresh.refresh();

    expect(received.map((item) => item.generatedAt)).toEqual(["2026-05-17T12:01:00.000Z"]);
    refresh.dispose();
  });

  test("preserves the initial snapshot when refresh is invalid or fails", async () => {
    const received: Snapshot[] = [];
    const errors: unknown[] = [];
    let attempt = 0;
    const refresh = createSnapshotRefresh(refreshOptions({
      load: async () => {
        attempt += 1;
        if (attempt === 1) return snapshot("not-a-timestamp");
        throw new Error("source unavailable");
      },
      onSnapshot: (next) => received.push(next),
      onError: (error) => errors.push(error),
    }));

    await refresh.refresh();
    await refresh.refresh();

    expect(received).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(refresh.current.generatedAt).toBe("2026-05-17T12:00:00.000Z");
    refresh.dispose();
  });

  test("aborts an in-flight refresh and clears the interval on cleanup", async () => {
    let intervalCallback: (() => void) | undefined;
    let cleared: number | undefined;
    let signal: AbortSignal | undefined;
    const pending = new Promise<Snapshot>(() => {});
    const refresh = createSnapshotRefresh(refreshOptions({
      load: (nextSignal) => { signal = nextSignal; return pending; },
      setInterval: (callback) => { intervalCallback = callback; return 42; },
      clearInterval: (id) => { cleared = id; },
    }));

    intervalCallback?.();
    await Promise.resolve();
    refresh.dispose();

    expect(signal?.aborted).toBe(true);
    expect(cleared).toBe(42);
  });
});
