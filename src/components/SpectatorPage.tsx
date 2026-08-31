import { SpectatorBoard } from "@/components/SpectatorBoard";
import type { Ranking } from "@/lib/ranking";
import type { Activity } from "@/lib/stats";

export function SpectatorPage({ activity, initialRanking, availableYears, selectedYear, initialError }: { activity: Activity; initialRanking: Ranking | null; availableYears: readonly number[]; selectedYear: number; initialError?: string | null }) {
  return <SpectatorBoard activity={activity} initialRanking={initialRanking} availableYears={availableYears} selectedYear={selectedYear} initialError={initialError} />;
}
