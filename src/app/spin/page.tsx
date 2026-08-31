import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchLatestRanking } from "@/lib/rankingSource";

export default async function SpinPage() {
  try {
    return <SpectatorPage activity="spin" initialRanking={await fetchLatestRanking("spin")} />;
  } catch (error) {
    return <SpectatorPage activity="spin" initialRanking={null} initialError={error instanceof Error ? error.message : "Could not load rankings"} />;
  }
}
