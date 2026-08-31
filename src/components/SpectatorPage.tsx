import { SpectatorBoard } from "@/components/SpectatorBoard";
import type { Ranking } from "@/lib/ranking";
import type { Activity } from "@/lib/stats";

export function SpectatorPage({ activity, initialRanking, initialError }: { activity: Activity; initialRanking: Ranking | null; initialError?: string | null }) {
  return <SpectatorBoard activity={activity} initialRanking={initialRanking} initialError={initialError} />;
}
