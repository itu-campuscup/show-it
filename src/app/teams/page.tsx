import { TeamComparisonBoard } from "@/components/TeamComparisonBoard";
import { fetchTeamComparison } from "@/lib/teamComparisonSource";

export default async function TeamsPage() {
  try {
    return <TeamComparisonBoard initialComparison={await fetchTeamComparison()} />;
  } catch (error) {
    return <TeamComparisonBoard initialComparison={null} initialError={error instanceof Error ? error.message : "Could not load team comparison"} />;
  }
}
