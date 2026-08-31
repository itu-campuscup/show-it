import { afterEach, describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRankingRefresh, SpectatorBoard, type RankingRefreshOptions } from "./SpectatorBoard";
import type { Ranking } from "@/lib/ranking";

const ranking = (generatedAt: string): Ranking => ({ activity: "spin", year: 2025, generatedAt, entries: [] });
const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

afterEach(() => {
  globalThis.setInterval = originalSetInterval;
  globalThis.clearInterval = originalClearInterval;
});

function refreshOptions(overrides: Partial<RankingRefreshOptions>): RankingRefreshOptions {
  return {
    initialRanking: ranking("2026-05-17T12:00:00.000Z"),
    load: async () => ranking("2026-05-17T12:01:00.000Z"),
    onRanking: () => {},
    onError: () => {},
    ...overrides,
  };
}

describe("ranking year selection", () => {
  test("renders every published year and marks the selected year", () => {
    const markup = renderToStaticMarkup(createElement(SpectatorBoard, {
      activity: "spin",
      initialRanking: ranking("2026-05-17T12:00:00.000Z"),
      availableYears: [2025, 2024],
      selectedYear: 2025,
    }));

    expect(markup).toContain("Year");
    expect(markup).toContain("<option value=\"2025\" selected=\"\">2025</option>");
    expect(markup).toContain("<option value=\"2024\">2024</option>");
  });
});

describe("published ranking refresh boundary", () => {
  test("replaces the initial ranking only with a newer valid ranking", async () => {
    const received: Ranking[] = [];
    const refresh = createRankingRefresh(refreshOptions({ onRanking: (next) => received.push(next) }));

    await refresh.refresh();

    expect(received.map((item) => item.generatedAt)).toEqual(["2026-05-17T12:01:00.000Z"]);
    refresh.dispose();
  });

  test("preserves the initial ranking when refresh is invalid or fails", async () => {
    const received: Ranking[] = [];
    const errors: unknown[] = [];
    let attempt = 0;
    const refresh = createRankingRefresh(refreshOptions({
      load: async () => {
        attempt += 1;
        if (attempt === 1) return ranking("not-a-timestamp");
        throw new Error("source unavailable");
      },
      onRanking: (next) => received.push(next),
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
    const pending = new Promise<Ranking>(() => {});
    const refresh = createRankingRefresh(refreshOptions({
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
