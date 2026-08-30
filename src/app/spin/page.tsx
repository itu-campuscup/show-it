import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchCurrentHeatSnapshot } from "@/lib/snapshotSource";

export default async function SpinPage() {
  try {
    return <SpectatorPage activity="spin" initialSnapshot={await fetchCurrentHeatSnapshot()} />;
  } catch (error) {
    return <SpectatorPage activity="spin" initialSnapshot={null} initialError={error instanceof Error ? error.message : "Could not load spectator snapshot"} />;
  }
}
