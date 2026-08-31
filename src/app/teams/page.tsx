import { TeamComparisonBoard } from "@/components/TeamComparisonBoard";
import { fetchTeamComparison } from "@/lib/teamComparisonSource";
import { fetchAvailableYears, resolveYear } from "@/lib/yearSelection";

type TeamsPageProps = { searchParams: Promise<{ year?: string | string[] }> };

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const requestedYear = Array.isArray(params.year) ? params.year[0] : params.year;
  const availableYears = await fetchAvailableYears();
  const selectedYear = resolveYear(availableYears, requestedYear);

  try {
    return <TeamComparisonBoard initialComparison={await fetchTeamComparison(selectedYear)} availableYears={availableYears} selectedYear={selectedYear} />;
  } catch (error) {
    return <TeamComparisonBoard initialComparison={null} initialError={error instanceof Error ? error.message : "Could not load team comparison"} availableYears={availableYears} selectedYear={selectedYear} />;
  }
}
