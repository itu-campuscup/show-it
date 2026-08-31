import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchLatestRanking } from "@/lib/rankingSource";

export default async function DrinkPage() {
  try {
    return <SpectatorPage activity="beer" initialRanking={await fetchLatestRanking("beer")} />;
  } catch (error) {
    return <SpectatorPage activity="beer" initialRanking={null} initialError={error instanceof Error ? error.message : "Could not load rankings"} />;
  }
}
