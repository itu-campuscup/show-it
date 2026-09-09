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

const comparison2026: TeamComparison = {
  schemaVersion: 1,
  generatedAt: "2026-09-09T19:07:12.149Z",
  teams: [team("team-2026", "Future Anchors", [99, 98, 97])],
};

describe("team comparison rendering", () => {
  test("renders independently selected team-years", () => {
    const markup = renderToStaticMarkup(
      <TeamComparisonBoard
        initialTeamOne={{ year: 2025, comparison }}
        initialTeamTwo={{ year: 2026, comparison: comparison2026 }}
        initialTeam1Id="team-1"
        initialTeam2Id="team-2026"
        availableYears={[2026, 2025]}
      />,
    );
    expect(markup).toContain("<option value=\"2025\" selected=\"\">2025</option>");
    expect(markup).toContain("<option value=\"2026\" selected=\"\">2026</option>");
    expect(markup).toContain("Anchors");
    expect(markup).toContain("Future Anchors");
    expect(markup).toContain("Anchors performance: Beer 93%, Sail 89%, Spin 94%");
    expect(markup).toContain("Future Anchors performance: Beer 99%, Sail 98%, Spin 97%");
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
