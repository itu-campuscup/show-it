import { parseTeamComparison, type TeamComparison } from "./teamComparison";
import { statsBaseUrl } from "./stats";

export async function fetchTeamComparison(baseUrl = process.env.NEXT_PUBLIC_STATS_BASE_URL, signal?: AbortSignal): Promise<TeamComparison> {
  const init: RequestInit = { cache: "no-store", credentials: "omit" };
  if (signal) init.signal = signal;
  const response = await fetch(`${statsBaseUrl(baseUrl)}/teams/index.json`, init);
  if (!response.ok) throw new Error(`Team comparison returned ${response.status}`);
  try {
    return parseTeamComparison(await response.json());
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unsupported team comparison")) throw error;
    throw new Error("Team comparison contained malformed JSON");
  }
}
