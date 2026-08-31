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

export async function fetchRanking(activity: Activity, year: number, baseUrl = process.env.NEXT_PUBLIC_STATS_BASE_URL, signal?: AbortSignal): Promise<Ranking> {
  if (!Number.isSafeInteger(year) || year <= 0) throw new Error("Stats ranking requested invalid year");

  const ranking = parseRanking(await request(`${statsBaseUrl(baseUrl)}/rankings/${year}/${activity}.json`, signal));
  if (ranking.activity !== activity || ranking.year !== year) throw new Error("Stats ranking did not match the requested activity and year");
  return ranking;
}
