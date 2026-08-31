import { parseRanking, type Ranking } from "./ranking";
import { statsBaseUrl, type Activity } from "./stats";

const request = async (url: string, signal?: AbortSignal): Promise<unknown> => {
  const init: RequestInit = { cache: "no-store", credentials: "omit" };
  if (signal) init.signal = signal;
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Stats ranking returned ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error("Stats ranking contained malformed JSON");
  }
};

export async function fetchLatestRanking(activity: Activity, baseUrl = process.env.NEXT_PUBLIC_STATS_BASE_URL, signal?: AbortSignal): Promise<Ranking> {
  const root = statsBaseUrl(baseUrl);
  const index = await request(`${root}/index.json`, signal);
  if (!index || typeof index !== "object" || !("years" in index) || !Array.isArray(index.years)) throw new Error("Stats index contained invalid years");
  const years = index.years.filter((year): year is number => Number.isInteger(year) && year > 0);
  if (years.length === 0) throw new Error("Stats index contained no ranking years");
  const year = Math.max(...years);
  const ranking = parseRanking(await request(`${root}/rankings/${year}/${activity}.json`, signal));
  if (ranking.activity !== activity || ranking.year !== year) throw new Error("Stats ranking did not match the requested activity and year");
  return ranking;
}
