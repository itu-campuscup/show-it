import { describe, expect, test } from "bun:test";
import type { Snapshot } from "@/lib/snapshot";

type Refresh = {
  current: Snapshot | null;
  refresh: () => Promise<void>;
  dispose: () => void;
};

type RefreshOptions = {
  initialSnapshot: Snapshot | null;
  load: (signal: AbortSignal) => Promise<Snapshot>;
  onSnapshot: (snapshot: Snapshot) => void;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  setInterval?: (callback: () => void, delay: number) => unknown;
  clearInterval?: (id: unknown) => void;
};

type HeatDashboardModule = {
  CURRENT_HEAT_REFRESH_INTERVAL_MS?: unknown;
  createCurrentHeatRefresh?: (options: RefreshOptions) => Refresh;
};

const snapshot = (generatedAt: string): Snapshot => ({
  schemaVersion: 1,
  generatedAt,
  sourceFetchedAt: generatedAt,
  currentHeat: {
    id: "heat-1",
    number: 1,
    year: 2026,
    date: generatedAt,
    state: "running",
    activeActivity: "sail",
  },
  activities: {
    beer: { completed: [], active: [], attemptsStarted: 0, attemptsCompleted: 0 },
    spin: { completed: [], active: [], attemptsStarted: 0, attemptsCompleted: 0 },
    sail: { teams: [] },
  },
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

const getCreateCurrentHeatRefresh = async (): Promise<(options: RefreshOptions) => Refresh> => {
  // This intentional dynamic import keeps the RED test in assertion failure when exports are absent.
  const module = await import("./HeatDashboard") as unknown as HeatDashboardModule;
  expect(module.CURRENT_HEAT_REFRESH_INTERVAL_MS).toBe(60_000);
  expect(typeof module.createCurrentHeatRefresh).toBe("function");
  return module.createCurrentHeatRefresh!;
};

describe("current heat refresh boundary", () => {
  test("schedules polling at exactly 60 seconds", async () => {
    const createCurrentHeatRefresh = await getCreateCurrentHeatRefresh();
    let scheduledDelay: number | undefined;
    const refresh = createCurrentHeatRefresh({
      initialSnapshot: snapshot("2026-05-17T12:00:00.000Z"),
      load: async () => snapshot("2026-05-17T12:01:00.000Z"),
      onSnapshot: () => {},
      onSuccess: () => {},
      onError: () => {},
      setInterval: (_callback, delay) => {
        scheduledDelay = delay;
        return "current-heat-interval";
      },
      clearInterval: () => {},
    });

    expect(scheduledDelay).toBe(60_000);
    refresh.dispose();
  });

  test("accepts the first valid snapshot when the initial snapshot is absent", async () => {
    const createCurrentHeatRefresh = await getCreateCurrentHeatRefresh();
    const next = snapshot("2026-05-17T12:01:00.000Z");
    const received: Snapshot[] = [];
    let successes = 0;
    const refresh = createCurrentHeatRefresh({
      initialSnapshot: null,
      load: async () => next,
      onSnapshot: (snapshot) => received.push(snapshot),
      onSuccess: () => { successes += 1; },
      onError: () => {},
      setInterval: () => "current-heat-interval",
      clearInterval: () => {},
    });

    await refresh.refresh();

    expect(received).toEqual([next]);
    expect(successes).toBe(1);
    expect(refresh.current).toBe(next);
    refresh.dispose();
  });

  test("replaces only for newer responses while succeeding for every valid response", async () => {
    const createCurrentHeatRefresh = await getCreateCurrentHeatRefresh();
    const initial = snapshot("2026-05-17T12:00:00.000Z");
    const responses = [
      snapshot("2026-05-17T12:00:00.000Z"),
      snapshot("2026-05-17T11:59:00.000Z"),
      snapshot("2026-05-17T12:01:00.000Z"),
    ];
    const received: string[] = [];
    let successes = 0;
    const refresh = createCurrentHeatRefresh({
      initialSnapshot: initial,
      load: async () => responses.shift()!,
      onSnapshot: (next) => received.push(next.generatedAt),
      onSuccess: () => { successes += 1; },
      onError: () => {},
      setInterval: () => "current-heat-interval",
      clearInterval: () => {},
    });

    await refresh.refresh();
    await refresh.refresh();
    await refresh.refresh();

    expect(received).toEqual(["2026-05-17T12:01:00.000Z"]);
    expect(successes).toBe(3);
    expect(refresh.current.generatedAt).toBe("2026-05-17T12:01:00.000Z");
    refresh.dispose();
  });

  test("reports failure and preserves the last valid snapshot", async () => {
    const createCurrentHeatRefresh = await getCreateCurrentHeatRefresh();
    const initial = snapshot("2026-05-17T12:00:00.000Z");
    const failure = new Error("current heat unavailable");
    const errors: unknown[] = [];
    const refresh = createCurrentHeatRefresh({
      initialSnapshot: initial,
      load: async () => { throw failure; },
      onSnapshot: () => {},
      onSuccess: () => {},
      onError: (error) => errors.push(error),
      setInterval: () => "current-heat-interval",
      clearInterval: () => {},
    });

    await refresh.refresh();

    expect(errors).toEqual([failure]);
    expect(refresh.current).toBe(initial);
    refresh.dispose();
  });

  test("aborts an overlapping request and ignores its late resolution", async () => {
    const createCurrentHeatRefresh = await getCreateCurrentHeatRefresh();
    const initial = snapshot("2026-05-17T12:00:00.000Z");
    const first = deferred<Snapshot>();
    const second = deferred<Snapshot>();
    const requests = [first, second];
    const signals: AbortSignal[] = [];
    const received: string[] = [];
    const refresh = createCurrentHeatRefresh({
      initialSnapshot: initial,
      load: (signal) => {
        signals.push(signal);
        return requests.shift()!.promise;
      },
      onSnapshot: (next) => received.push(next.generatedAt),
      onSuccess: () => {},
      onError: () => {},
      setInterval: () => "current-heat-interval",
      clearInterval: () => {},
    });

    const firstRun = refresh.refresh();
    await Promise.resolve();
    const secondRun = refresh.refresh();
    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);

    second.resolve(snapshot("2026-05-17T12:02:00.000Z"));
    await secondRun;
    first.resolve(snapshot("2026-05-17T12:03:00.000Z"));
    await firstRun;

    expect(received).toEqual(["2026-05-17T12:02:00.000Z"]);
    expect(refresh.current.generatedAt).toBe("2026-05-17T12:02:00.000Z");
    refresh.dispose();
  });

  test("aborts active work, clears its interval, and ignores late responses on dispose", async () => {
    const createCurrentHeatRefresh = await getCreateCurrentHeatRefresh();
    const initial = snapshot("2026-05-17T12:00:00.000Z");
    const pending = deferred<Snapshot>();
    let signal: AbortSignal | undefined;
    let intervalId: unknown;
    const cleared: unknown[] = [];
    const refresh = createCurrentHeatRefresh({
      initialSnapshot: initial,
      load: (nextSignal) => {
        signal = nextSignal;
        return pending.promise;
      },
      onSnapshot: () => {},
      onSuccess: () => {},
      onError: () => {},
      setInterval: () => {
        intervalId = { id: 42 };
        return intervalId;
      },
      clearInterval: (id) => cleared.push(id),
    });

    const run = refresh.refresh();
    await Promise.resolve();
    refresh.dispose();
    pending.resolve(snapshot("2026-05-17T12:04:00.000Z"));
    await run;

    expect(signal?.aborted).toBe(true);
    expect(cleared).toEqual([intervalId]);
    expect(refresh.current).toBe(initial);
  });
});
