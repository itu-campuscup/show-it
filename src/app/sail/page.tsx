import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchLatestRanking } from "@/lib/rankingSource";

export default async function SailPage() {
  try {
    return <SpectatorPage activity="sail" initialRanking={await fetchLatestRanking("sail")} />;
  } catch (error) {
    return <SpectatorPage activity="sail" initialRanking={null} initialError={error instanceof Error ? error.message : "Could not load rankings"} />;
  }
}
