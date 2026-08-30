import { currentHeatSnapshotPath, statsBaseUrl } from "./stats";
import { parseCurrentHeatSnapshot, type Snapshot } from "./snapshot";

export async function fetchCurrentHeatSnapshot(baseUrl = process.env.NEXT_PUBLIC_STATS_BASE_URL, signal?: AbortSignal): Promise<Snapshot> {
  const init: RequestInit = { cache: "no-store", credentials: "omit" };
  if (signal) init.signal = signal;
  const response = await fetch(currentHeatSnapshotPath(statsBaseUrl(baseUrl)), init);
  if (!response.ok) throw new Error(`Stats snapshot returned ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Stats snapshot contained malformed JSON");
  }
  return parseCurrentHeatSnapshot(body);
}
