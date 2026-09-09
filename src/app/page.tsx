import { ChampionDashboard } from "@/components/ChampionDashboard";
import { selectLatestChampions } from "@/lib/championSelection";
import { fetchRanking } from "@/lib/rankingSource";
import { fetchAvailableYears } from "@/lib/yearSelection";

export default async function Home() {
  try {
    const champions = await selectLatestChampions(await fetchAvailableYears(), (activity, year) => fetchRanking(activity, year));
    return <ChampionDashboard champions={champions} />;
  } catch (cause) {
    return <ChampionDashboard champions={null} error={cause instanceof Error ? cause.message : "Could not load published champions"} />;
  }
}
