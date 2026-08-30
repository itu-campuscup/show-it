import { afterEach, describe, expect, test } from "bun:test";
import { fetchCurrentHeatSnapshot } from "./snapshotSource";

const snapshot = {
  schemaVersion: 1,
  generatedAt: "2026-05-17T12:05:00.000Z",
  sourceFetchedAt: "2026-05-17T12:04:58.000Z",
  currentHeat: { id: "heat-4", number: 4, year: 2026, date: "2026-05-17", state: "running", activeActivity: null },
  activities: {
    beer: { completed: [], active: [], attemptsStarted: 0, attemptsCompleted: 0 },
    spin: { completed: [], active: [], attemptsStarted: 0, attemptsCompleted: 0 },
    sail: { teams: [] },
  },
};

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("public current heat snapshot source", () => {
  test("fetches only the public snapshot with no-store and omitted credentials", async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = async (input, init) => {
      calls.push({ input, init });
      return new Response(JSON.stringify(snapshot), { status: 200, headers: { "content-type": "application/json" } });
    };

    const result = await fetchCurrentHeatSnapshot("https://stats.example/");

    expect(result.currentHeat.id).toBe("heat-4");
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toBe("https://stats.example/current-heat.json");
    expect(calls[0].init).toEqual({ cache: "no-store", credentials: "omit" });
  });

  test("rejects non-OK responses", async () => {
    globalThis.fetch = async () => new Response("unavailable", { status: 503 });

    await expect(fetchCurrentHeatSnapshot()).rejects.toThrow("503");
  });

  test("rejects malformed JSON and invalid snapshot bodies", async () => {
    globalThis.fetch = async () => new Response("not json", { status: 200 });
    await expect(fetchCurrentHeatSnapshot()).rejects.toThrow("malformed");

    globalThis.fetch = async () => new Response(JSON.stringify({ schemaVersion: 2 }), { status: 200 });
    await expect(fetchCurrentHeatSnapshot()).rejects.toThrow("Unsupported snapshot");
  });
});
