import type { Ranking } from "./ranking";
import type { Activity } from "./stats";

export type ChampionRankings = {
  year: number;
  rankings: Record<Activity, Ranking>;
};

type RankingLoader = (activity: Activity, year: number) => Promise<Ranking>;

export async function selectLatestChampions(years: readonly number[], load: RankingLoader): Promise<ChampionRankings> {
  for (const year of years) {
    const [beer, sail, spin] = await Promise.all([
      load("beer", year),
      load("sail", year),
      load("spin", year),
    ]);
    if (beer.entries[0]?.rank === 1 && sail.entries[0]?.rank === 1 && spin.entries[0]?.rank === 1) {
      return { year, rankings: { beer, sail, spin } };
    }
  }

  throw new Error("No published year contained Beer, Sail, and Spin champions");
}
