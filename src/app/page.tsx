import { HeatDashboard } from "@/components/HeatDashboard";
import { fetchCurrentHeatSnapshot } from "@/lib/snapshotSource";

export default async function Home() {
  try {
    return <HeatDashboard initialSnapshot={await fetchCurrentHeatSnapshot()} />;
  } catch (cause) {
    return <HeatDashboard initialSnapshot={null} initialError={cause instanceof Error ? cause.message : "Could not load spectator snapshot"} />;
  }
}
