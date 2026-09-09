import { TeamComparisonBoard } from "@/components/TeamComparisonBoard";
import { fetchTeamComparison } from "@/lib/teamComparisonSource";
import { fetchAvailableYears, resolveYear } from "@/lib/yearSelection";

type TeamsPageProps = {
  searchParams: Promise<{
    team1Year?: string | string[];
    team1?: string | string[];
    team2Year?: string | string[];
    team2?: string | string[];
  }>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const availableYears = await fetchAvailableYears();
  const team1Year = resolveYear(availableYears, first(params.team1Year));
  const team2Year = resolveYear(availableYears, first(params.team2Year));
  const load = async (year: number) => {
    try {
      return { year, comparison: await fetchTeamComparison(year), error: null };
    } catch (cause) {
      return { year, comparison: null, error: cause instanceof Error ? cause.message : "Could not load team comparison" };
    }
  };
  const [initialTeamOne, initialTeamTwo] = await Promise.all([load(team1Year), load(team2Year)]);

  return <TeamComparisonBoard
    initialTeamOne={initialTeamOne}
    initialTeamTwo={initialTeamTwo}
    initialTeam1Id={first(params.team1)}
    initialTeam2Id={first(params.team2)}
    availableYears={availableYears}
  />;
}
