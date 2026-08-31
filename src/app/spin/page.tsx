import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchRanking } from "@/lib/rankingSource";
import { fetchAvailableYears, resolveYear } from "@/lib/yearSelection";

type SpinPageProps = {
  searchParams: Promise<{ year?: string | string[] }>;
};

export default async function SpinPage({ searchParams }: SpinPageProps) {
  const { year: requestedYear } = await searchParams;
  const availableYears = await fetchAvailableYears();
  const selectedYear = resolveYear(availableYears, Array.isArray(requestedYear) ? requestedYear[0] : requestedYear);
  try {
    return <SpectatorPage activity="spin" availableYears={availableYears} selectedYear={selectedYear} initialRanking={await fetchRanking("spin", selectedYear)} />;
  } catch (error) {
    return <SpectatorPage activity="spin" availableYears={availableYears} selectedYear={selectedYear} initialRanking={null} initialError={error instanceof Error ? error.message : "Could not load rankings"} />;
  }
}
