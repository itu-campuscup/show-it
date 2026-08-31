import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComparisonTeam, TeamComparison } from "@/lib/teamComparison";
import { TeamComparisonBoard, TeamPreviewCard, TeamRadarChart } from "./TeamComparisonBoard";

const team = (
  teamId: string,
  teamName: string,
  values: [number, number, number],
  overrides: Partial<ComparisonTeam> = {},
): ComparisonTeam => ({
  teamId,
  teamName,
  isOut: false,
  players: [],
  bestTimes: {},
  radarData: [
    { subject: "Beer", performance: values[0], fullMark: 100 },
    { subject: "Sail", performance: values[1], fullMark: 100 },
    { subject: "Spin", performance: values[2], fullMark: 100 },
  ],
  ...overrides,
});

const comparison: TeamComparison = {
  schemaVersion: 1,
  generatedAt: "2026-08-31T16:10:51.628Z",
  teams: [
    team("team-1", "Anchors", [93, 89, 94], {
      imageUrl: "https://images.example/anchors.png",
      players: [{ playerId: "player-1", playerName: "Ada" }],
    }),
    team("team-2", "Spinners", [80, 72, 99], { isOut: true }),
  ],
};

describe("team comparison rendering", () => {
  test("offers every team for the selected year, including inactive teams", () => {
    const markup = renderToStaticMarkup(
      <TeamComparisonBoard
        initialComparison={comparison}
        availableYears={[2025, 2024]}
        selectedYear={2025}
      />,
    );
    expect(markup).toContain("<option value=\"2025\" selected=\"\">2025</option>");
    expect(markup.match(/Anchors/g)).toHaveLength(2);
    expect(markup.match(/Spinners \(Inactive\)/g)).toHaveLength(2);
  });

  test("renders canonical Beer, Sail, and Spin radar values", () => {
    const markup = renderToStaticMarkup(<TeamRadarChart team1={comparison.teams[0]} team2={comparison.teams[1]} />);
    expect(markup).toContain("Beer");
    expect(markup).toContain("Sail");
    expect(markup).toContain("Spin");
    expect(markup).toContain("Anchors performance: Beer 93%, Sail 89%, Spin 94%");
  });

  test("renders a selected team photo, status, and players", () => {
    const markup = renderToStaticMarkup(<TeamPreviewCard team={comparison.teams[0]} variant="one" />);
    expect(markup).toContain("https://images.example/anchors.png");
    expect(markup).toContain("Active");
    expect(markup).toContain("Ada");
  });

  test("uses team initials when a selected team has no photo", () => {
    const markup = renderToStaticMarkup(<TeamPreviewCard team={comparison.teams[1]} variant="two" />);
    expect(markup).toContain("SP");
    expect(markup).toContain("Inactive");
  });
});
