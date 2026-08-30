import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchCurrentHeatSnapshot } from "@/lib/snapshotSource";

export default async function SailPage() {
  try {
    return <SpectatorPage activity="sail" initialSnapshot={await fetchCurrentHeatSnapshot()} />;
  } catch (error) {
    return <SpectatorPage activity="sail" initialSnapshot={null} initialError={error instanceof Error ? error.message : "Could not load spectator snapshot"} />;
  }
}
