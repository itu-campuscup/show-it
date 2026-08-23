export type Activity = "beer" | "spin" | "sail";

export const DEFAULT_STATS_BASE_URL = "https://itu-campuscup.github.io/judge-it-stats";

export function statsBaseUrl(value: string | undefined): string {
  return (value?.trim() || DEFAULT_STATS_BASE_URL).replace(/\/+$/, "");
}

export function currentHeatRankingPath(baseUrl: string, year: number, heat: number, activity: Activity): string {
  return `${statsBaseUrl(baseUrl)}/rankings/${year}/heat-${heat}/${activity}.json`;
}
