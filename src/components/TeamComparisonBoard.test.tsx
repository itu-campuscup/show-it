import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComparisonTeam, TeamComparison } from "@/lib/teamComparison";
import { TeamComparisonBoard, TeamRadarChart } from "./TeamComparisonBoard";

const team = (teamId: string, teamName: string, values: [number, number, number]): ComparisonTeam => ({
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
});

const comparison: TeamComparison = {
  schemaVersion: 1,
  generatedAt: "2026-08-31T16:10:51.628Z",
  teams: [team("team-1", "Anchors", [93, 89, 94]), team("team-2", "Spinners", [80, 72, 99])],
};

describe("team comparison rendering", () => {
  test("offers every active team in both selectors", () => {
    const markup = renderToStaticMarkup(<TeamComparisonBoard initialComparison={comparison} />);
    expect(markup).toContain("Select Team 1");
    expect(markup).toContain("Select Team 2");
    expect(markup.match(/Anchors/g)).toHaveLength(2);
    expect(markup.match(/Spinners/g)).toHaveLength(2);
  });

  test("renders canonical Beer, Sail, and Spin radar values", () => {
    const markup = renderToStaticMarkup(<TeamRadarChart team1={comparison.teams[0]} team2={comparison.teams[1]} />);
    expect(markup).toContain("Beer");
    expect(markup).toContain("Sail");
    expect(markup).toContain("Spin");
    expect(markup).toContain("Anchors performance: Beer 93%, Sail 89%, Spin 94%");
  });
});
