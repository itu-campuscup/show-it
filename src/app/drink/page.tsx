import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchCurrentHeatSnapshot } from "@/lib/snapshotSource";

export default async function DrinkPage() {
  try {
    return <SpectatorPage activity="beer" initialSnapshot={await fetchCurrentHeatSnapshot()} />;
  } catch (error) {
    return <SpectatorPage activity="beer" initialSnapshot={null} initialError={error instanceof Error ? error.message : "Could not load spectator snapshot"} />;
  }
}
