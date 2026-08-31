# Year-Aware Rankings and Team Comparison Design

## Goal

Make every historical ranking view explicitly year-aware. Team comparison defaults to the current calendar year when published data exists, otherwise the latest published prior year. Users can select any published year and compare every team that participated in it, including teams now marked inactive. Selected team photos appear beside the comparison.

## Published data

`judge-it-stats` remains the source of truth. Its root `index.json` continues to publish the descending list of available years.

Team comparison data becomes year-specific:

- `teams/{year}/index.json` contains every team referenced by a time log belonging to a heat in that year.
- Each team's best times and radar values use only that year's logs and heats.
- Historical participation is determined from `timeLogs.team_id`; current player-to-team membership must not rewrite historical teams.
- Inactive teams remain in the payload with `isOut: true`.
- Team image URLs remain part of each profile.

The unversioned `teams/index.json` contract is removed after all Show IT callers migrate.

## Year selection

A shared year-selection module parses the root stats manifest and selects a default year:

1. Use the current calendar year when it exists in `years`.
2. Otherwise use the greatest published year lower than the current year.
3. If only future years exist, use the smallest future year.
4. Reject an unavailable `?year=` value and use the same default rule.

The selected year is stored in the page URL as `?year=YYYY`. This makes links shareable and preserves browser back/forward behavior.

## Activity ranking pages

Drink, Spin, and Sail use the same year selector. Their initial server render loads `rankings/{year}/{activity}.json`. Changing the selector navigates to the same route with the selected `year` query parameter. Existing 60-second refreshes request only the selected year and never change the user's selection.

## Team comparison page

The Teams page loads `teams/{year}/index.json` for the selected year. Both team selectors contain all teams from the payload, sorted by name. Inactive teams are retained and labelled `Inactive`; they are not filtered out.

Changing the year clears both selected teams because team IDs and performance are scoped to a year. The page then loads that year's comparison data.

When a team is selected, a preview card shows:

- team photo, or an initials fallback when no image exists;
- team name;
- active/inactive status;
- player names for that published profile.

The two preview cards sit above the radar chart and use the same blue/orange identities as the chart polygons and legend.

## Data flow and failures

Server page loaders fetch the manifest, resolve the requested year, and fetch the corresponding ranking or team comparison. Client refreshes use explicit-year fetch functions.

If a selected year's artifact cannot be loaded, the page keeps the year selector available and shows the existing unavailable/error state. It must not silently show data from another year under the selected label. Malformed manifests, rankings, and team profiles remain hard parse errors.

## Testing

`judge-it-stats` tests must prove that team indexes are written per year, exclude teams without participation in that year, include inactive participating teams, and calculate radar values from only that year's logs.

Show IT source tests must prove default-year fallback, explicit-year URLs, invalid-year fallback, and contract validation. Component rendering tests must prove all teams appear, inactive labels render, all four tabs expose the selector, selected team photos render, and missing photos use initials.

A production build and local HTTP smoke test must cover `/drink?year=2025`, `/spin?year=2025`, `/sail?year=2025`, and `/teams?year=2025`. No deployment occurs without separate explicit approval.