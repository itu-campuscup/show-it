# Year-Aware Rankings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add year selection to every ranking view and publish correct year-scoped team comparisons with inactive teams and team photos.

**Architecture:** `judge-it-stats` publishes `teams/{year}/index.json` from year-filtered heat logs. Show IT resolves a requested/default year from the root manifest, uses explicit-year fetch functions, stores selection in `?year=`, and shares one year-selector component across ranking and team pages.

**Tech Stack:** Bun, TypeScript, React 19, Next.js 16 App Router, CSS Modules.

---

### Task 1: Publish year-scoped team comparisons

**Files:**
- Modify: `/Users/lucasfreytorreshanson/Desktop/code/judge-it-stats/src/rankings.ts`
- Modify: `/Users/lucasfreytorreshanson/Desktop/code/judge-it-stats/src/generate.ts`
- Modify: `/Users/lucasfreytorreshanson/Desktop/code/judge-it-stats/src/generate.test.ts`
- Modify: `/Users/lucasfreytorreshanson/Desktop/code/judge-it-stats/README.md`

- [ ] Add failing generator tests with 2024 and 2025 heats, participating active/inactive teams, and an unrelated team. Assert `teams/2025/index.json` contains both participating teams, excludes the unrelated team, and computes metrics only from 2025 logs.
- [ ] Run `bun test src/generate.test.ts`; expect failure because `writeTeamProfiles` has no year argument and no year directory.
- [ ] Change `generateTeamProfiles(data, year)` to restrict heats and logs to `year`, derive historical team IDs from `timeLog.team_id`, retain matching teams regardless of `is_out`, and calculate best times from filtered data.
- [ ] Change `writeTeamProfiles(docsDir, data, year, generatedAt)` to write `teams/{year}/index.json` and `teams/{year}/{teamId}.json`. Invoke it for every generated year and remove the unversioned index writer.
- [ ] Run `bun test src/generate.test.ts`; expect pass.
- [ ] Update README output paths and contracts.

### Task 2: Resolve and fetch explicit years

**Files:**
- Create: `src/lib/yearSelection.ts`
- Create: `src/lib/yearSelection.test.ts`
- Modify: `src/lib/rankingSource.ts`
- Modify: `src/lib/rankingSource.test.ts`
- Modify: `src/lib/teamComparisonSource.ts`
- Modify: `src/lib/teamComparison.test.ts`

- [ ] Add failing tests for parsing manifest years, current-year preference, latest-prior fallback, smallest-future fallback, valid requested year, and invalid requested-year fallback.
- [ ] Add failing source tests asserting ranking URLs use `/rankings/{year}/{activity}.json` and team URLs use `/teams/{year}/index.json`.
- [ ] Run the targeted tests; expect missing exports/signature failures.
- [ ] Implement `fetchAvailableYears`, `resolveYear(years, requestedYear, nowYear)`, `fetchRanking(activity, year, ...)`, and `fetchTeamComparison(year, ...)`. Keep strict activity/year validation.
- [ ] Run targeted tests; expect pass.

### Task 3: Add shared year selector to activity rankings

**Files:**
- Create: `src/components/YearSelector.tsx`
- Modify: `src/components/SpectatorBoard.tsx`
- Modify: `src/components/SpectatorPage.tsx`
- Modify: `src/components/SpectatorBoard.test.ts`
- Modify: `src/app/drink/page.tsx`
- Modify: `src/app/spin/page.tsx`
- Modify: `src/app/sail/page.tsx`
- Modify: `src/app/page.module.css`

- [ ] Add failing rendering/source tests proving the selected year and every available year appear, and refresh requests the selected year.
- [ ] Run targeted tests; expect missing year props/selector.
- [ ] Implement `YearSelector` with `router.push` to the same pathname and `?year=YYYY`.
- [ ] Update all activity page loaders to read `searchParams.year`, fetch the manifest, resolve the year, and load that explicit ranking.
- [ ] Pass `availableYears` and `selectedYear` through `SpectatorPage` to `SpectatorBoard`; refresh only the selected year.
- [ ] Add compact selector styles consistent with the existing header controls.
- [ ] Run targeted tests; expect pass.

### Task 4: Add team years, inactive teams, and photos

**Files:**
- Modify: `src/components/TeamComparisonBoard.tsx`
- Modify: `src/components/TeamComparisonBoard.test.tsx`
- Modify: `src/app/teams/page.tsx`
- Modify: `src/app/page.module.css`

- [ ] Add failing tests proving inactive teams remain in both selectors with an inactive label, selected teams render photos/status/players, missing photos render initials, and the year selector appears.
- [ ] Run targeted tests; expect failure because inactive teams are filtered and preview cards do not exist.
- [ ] Add `availableYears` and `selectedYear` props, remove the `isOut` filter, label inactive options, and refresh `/teams/{year}/index.json`.
- [ ] Render two selected-team preview cards above the radar chart using `imageUrl` or initials fallback. Reset selected IDs when the year prop changes.
- [ ] Update the Teams page loader to resolve the query year and fetch the corresponding comparison.
- [ ] Add responsive image/card styles.
- [ ] Run targeted tests; expect pass.

### Task 5: Verify complete behavior

**Files:**
- Modify if needed: `README.md`

- [ ] Run `/Users/lucasfreytorreshanson/Desktop/code/judge-it-stats`: `bun test`.
- [ ] Generate sample artifacts and inspect `teams/2025/index.json` for inactive teams and image URLs.
- [ ] Run Show IT: `bun test && bun run build`.
- [ ] Start the production build locally and smoke-test `/drink?year=2025`, `/spin?year=2025`, `/sail?year=2025`, and `/teams?year=2025`.
- [ ] Confirm invalid and missing years resolve to 2025 with the current published manifest.
- [ ] Review the diff for obsolete unversioned team-index callers and remove them.
- [ ] Do not commit, push, trigger stats publication, or deploy Show IT without Lucas’s explicit approval.