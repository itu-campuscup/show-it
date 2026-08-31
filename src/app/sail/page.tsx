import { SpectatorPage } from "@/components/SpectatorPage";
import { fetchRanking } from "@/lib/rankingSource";
import { fetchAvailableYears, resolveYear } from "@/lib/yearSelection";

type SailPageProps = {
  searchParams: Promise<{ year?: string | string[] }>;
};

export default async function SailPage({ searchParams }: SailPageProps) {
  const { year: requestedYear } = await searchParams;
  const availableYears = await fetchAvailableYears();
  const selectedYear = resolveYear(availableYears, Array.isArray(requestedYear) ? requestedYear[0] : requestedYear);
  try {
    return <SpectatorPage activity="sail" availableYears={availableYears} selectedYear={selectedYear} initialRanking={await fetchRanking("sail", selectedYear)} />;
  } catch (error) {
    return <SpectatorPage activity="sail" availableYears={availableYears} selectedYear={selectedYear} initialRanking={null} initialError={error instanceof Error ? error.message : "Could not load rankings"} />;
  }
}
