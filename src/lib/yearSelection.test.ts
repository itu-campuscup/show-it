import { afterEach, describe, expect, test } from "bun:test";
import { fetchAvailableYears, parseAvailableYears, resolveYear } from "./yearSelection";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("published year selection", () => {
  test("parses unique published years in descending order", () => {
    expect(parseAvailableYears({ years: [2024, 2025, 2025, "2026"] })).toEqual([2025, 2024]);
  });

  test("uses a requested published year", () => {
    expect(resolveYear([2025, 2024], "2024", 2026)).toBe(2024);
  });

  test("prefers the current year when it is published", () => {
    expect(resolveYear([2026, 2025], undefined, 2026)).toBe(2026);
  });

  test("falls back to the latest prior year", () => {
    expect(resolveYear([2025, 2024], "2030", 2026)).toBe(2025);
  });

  test("uses the nearest future year when no prior year exists", () => {
    expect(resolveYear([2028, 2027], undefined, 2026)).toBe(2027);
  });

  test("loads the public manifest", async () => {
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ years: [2024, 2025] }));
    };

    expect(await fetchAvailableYears("https://stats.example/")).toEqual([2025, 2024]);
    expect(calls).toEqual(["https://stats.example/index.json"]);
  });
});
