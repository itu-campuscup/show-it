import { SpectatorBoard } from "@/components/SpectatorBoard";
import type { Snapshot } from "@/lib/snapshot";
import type { Activity } from "@/lib/stats";

export function SpectatorPage({ activity, initialSnapshot, initialError }: { activity: Activity; initialSnapshot: Snapshot | null; initialError?: string | null }) {
  return <SpectatorBoard activity={activity} initialSnapshot={initialSnapshot} initialError={initialError} />;
}
