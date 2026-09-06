<div align="center">
  <img src="https://github.com/itu-campuscup/.github/blob/50aaa28abe375ead7588372c5afa0daae36014cf/campus.png?raw=true" alt="CampusCup logo" width="200" />
</div>

<h1 align="center">⚓ Show IT</h1>

<p align="center">
  <img alt="License" src="https://img.shields.io/github/license/itu-campuscup/show-it" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white" />
  <img alt="Bun" src="https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white" />
</p>
<p align="center">
  <img alt="GitHub issues" src="https://img.shields.io/github/issues/itu-campuscup/show-it" />
  <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/itu-campuscup/show-it" />
  <img alt="Commit activity" src="https://img.shields.io/github/commit-activity/m/itu-campuscup/show-it" />
</p>

<p align="center">
  <a href="https://show.campuscup.dk/">Production site</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="https://github.com/itu-campuscup/show-it/issues/new?labels=bug">Report a bug</a> ·
  <a href="https://github.com/itu-campuscup/show-it/issues/new?labels=enhancement">Suggest an enhancement</a>
</p>

Show IT is the public, mobile-first CampusCup spectator frontend. It presents the current heat and year-wide Beer, Spin, Sail, and team comparison views at [show.campuscup.dk](https://show.campuscup.dk/).

## Why Show IT?

The competition is easier to follow when spectators can see the current heat and the best performances in one place. Show IT gives the crowd a focused view of race progress and published rankings without exposing the protected systems used to run CampusCup.

## Table of contents

- [Routes](#routes)
- [Architecture and data boundary](#architecture-and-data-boundary)
- [Public data contract](#public-data-contract)
- [Schema reference](#schema-reference)
- [Local development](#local-development)
- [Testing](#testing)
- [Deploy to Vercel](#deploy-to-vercel)
- [Contributing](#contributing)
- [License](#license)
- [Contributors](#contributors)

## Routes

- `/` — current heat matchup, teams, sailors, race timer, and winner.
- `/drink/` — year-wide Beer rankings across every heat.
- `/spin/` — year-wide ten-revolution RPM rankings across every heat.
- `/sail/` — year-wide Sail time rankings across every heat.
- `/teams/` — two-team Beer, Sail, and Spin performance comparison.

Ranking and team views accept a `?year=YYYY` query parameter for a published year. The available-year selector is loaded from the public data manifest.

## Architecture and data boundary

```text
Judge IT + schema-backed stats
          │
          ▼
judge-it-stats publishes static JSON
          │
          ▼
GitHub Pages (public data) ──► Show IT on Vercel ──► spectators
```

Show IT and browser clients consume only static JSON published by [judge-it-stats](https://github.com/itu-campuscup/judge-it-stats) on GitHub Pages. They never call Judge IT, Convex, or the protected `/stats` endpoint. The schema submodule is reference material only; it is not imported into the browser bundle.

The homepage, ranking views, and team comparison poll their published JSON every minute. A publication older than seven minutes is marked stale rather than presented as current.

## Public data contract

The default public data source is `https://itu-campuscup.github.io/judge-it-stats`. Show IT reads:

- `index.json` for the available ranking years.
- `rankings/{year}/beer.json` for Beer rankings.
- `rankings/{year}/spin.json` for ten-revolution RPM rankings.
- `rankings/{year}/sail.json` for Sail rankings.
- `teams/{year}/index.json` for the team comparison view.
- `current-heat.json` for the homepage's current matchup, sailors, timer, and winner.

The versioned current-heat contract and relay rules are documented in [`docs/current-heat-snapshot.md`](docs/current-heat-snapshot.md). For local or staging work, override the source with `NEXT_PUBLIC_STATS_BASE_URL`.

## Schema reference

`schema/` is a pinned HTTPS submodule of [`itu-campuscup/schema`](https://github.com/itu-campuscup/schema), aligned with the stats generator. It is reference-only and must not be imported into the browser bundle.

Initialize it after cloning:

```bash
git submodule update --init --recursive
```

Update the submodule only when intentionally changing the reference:

```bash
git submodule update --remote --merge schema
```

## Local development

Requirements: [Bun](https://bun.com/) and Git with submodule support.

```bash
git clone --recurse-submodules https://github.com/itu-campuscup/show-it.git
cd show-it
bun install --backend copyfile
bun dev
```

The development server runs at [http://localhost:3000](http://localhost:3000). If the repository was cloned without submodules, run `git submodule update --init --recursive` before working with the schema reference.

## Testing

Run the repository's test suite and production build with the scripts defined in `package.json`:

```bash
bun test
bun run build
```

## Deploy to Vercel

1. Import [`itu-campuscup/show-it`](https://github.com/itu-campuscup/show-it) into the appropriate Vercel team.
2. Use `main` as the production branch.
3. Leave Vercel's Output Directory empty/default; this is a Next.js deployment, not a static `out` export.
4. Vercel detects the Next.js framework from `vercel.json` and runs `bun run build`.
5. Add `show.campuscup.dk` to the project and apply the DNS record Vercel provides for the hostname.

## Contributing

Contributions are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, architecture invariants, branch and commit conventions, and the pull request checklist.

## License

This project is licensed under the Apache License 2.0. See [`LICENSE`](LICENSE) for the full text.

## Contributors

See the [GitHub contributors graph](https://github.com/itu-campuscup/show-it/graphs/contributors) for everyone who has contributed to Show IT.
