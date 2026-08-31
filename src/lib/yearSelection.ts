import { statsBaseUrl } from "./stats";

const positiveInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;

const request = async (url: string, signal?: AbortSignal): Promise<unknown> => {
  const init: RequestInit = { cache: "no-store", credentials: "omit" };
  if (signal) init.signal = signal;
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Stats index returned ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error("Stats index contained malformed JSON");
  }
};

export function parseAvailableYears(value: unknown): number[] {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("years" in value) || !Array.isArray(value.years)) {
    throw new Error("Stats index contained invalid years");
  }

  const years = [...new Set(value.years.filter(positiveInteger))].sort((a, b) => b - a);
  if (years.length === 0) throw new Error("Stats index contained no ranking years");
  return years;
}

const parseRequestedYear = (value: string | number | undefined): number | undefined => {
  if (typeof value === "number") return positiveInteger(value) ? value : undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  const year = Number(value);
  return positiveInteger(year) ? year : undefined;
};

export function resolveYear(years: readonly number[], requestedYear?: string | number, currentYear = new Date().getFullYear()): number {
  const publishedYears = years.filter(positiveInteger);
  if (publishedYears.length === 0) throw new Error("Stats index contained no ranking years");

  const requested = parseRequestedYear(requestedYear);
  if (requested !== undefined && publishedYears.includes(requested)) return requested;

  const current = positiveInteger(currentYear) ? currentYear : new Date().getFullYear();
  if (publishedYears.includes(current)) return current;

  const prior = publishedYears.filter((year) => year < current).sort((a, b) => b - a)[0];
  if (prior !== undefined) return prior;

  const future = publishedYears.filter((year) => year > current).sort((a, b) => a - b)[0];
  if (future !== undefined) return future;

  throw new Error("Stats index contained no ranking years");
}

export async function fetchAvailableYears(baseUrl = process.env.NEXT_PUBLIC_STATS_BASE_URL, signal?: AbortSignal): Promise<number[]> {
  return parseAvailableYears(await request(`${statsBaseUrl(baseUrl)}/index.json`, signal));
}
