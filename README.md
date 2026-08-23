# Show IT ⚓

A mobile-first, static CampusCup spectator frontend. It never calls Judge IT, Convex, or the authenticated `/stats` endpoint from a browser.

## Routes

- `/drink/` — Beer results plus attempts that were in progress when the snapshot was published
- `/spin/` — ten-revolution RPM results plus attempts that were in progress when published
- `/sail/` — relay race board: team, current sailor, state, and Sail-log progress toward **16**

## Architecture

```text
Convex schema → authenticated judge-it-stats generator → public GitHub Pages JSON → Show IT GitHub Pages → spectators
```

The static projection protects Judge IT from spectator traffic. A snapshot is not real-time. The UI shows its publication timestamp and marks it stale after seven minutes.

## Schema reference

`schema/` is a pinned HTTPS submodule of [`itu-campuscup/schema`](https://github.com/itu-campuscup/schema), aligned to the stats generator. It is **reference only**. It must never be imported into the browser bundle because it contains server-side Convex code and the protected `/stats` endpoint.

```bash
git submodule update --init --recursive
# Intentional upgrade only:
git submodule update --remote --merge schema
```

## Public data contract

Show IT consumes:

`https://itu-campuscup.github.io/judge-it-stats/current-heat.json`

The versioned contract and relay rules are documented in [`docs/current-heat-snapshot.md`](docs/current-heat-snapshot.md). The current upstream generator must add this atomic public file. Its existing per-heat ranking files cannot faithfully reconstruct Sail relay progress or unmatched Beer/Spin attempts.

Override the source for local/staging work with `NEXT_PUBLIC_STATS_BASE_URL`.

## Deployment gates

1. Enable Pages with **Source: GitHub Actions** in `itu-campuscup/judge-it-stats` and repair/run its generator until `current-heat.json` returns public JSON.
2. Enable Pages with **Source: GitHub Actions** in this repository.
3. The included deployment workflow builds with `NEXT_PUBLIC_BASE_PATH=/show-it`, so assets and direct routes work under `https://lucasfth.github.io/show-it/`.

## Local development

```bash
git submodule update --init --recursive
bun install --backend copyfile
bun dev
```

On Android/Termux, build with Webpack:

```bash
NEXT_PUBLIC_BASE_PATH=/show-it node node_modules/next/dist/bin/next build --webpack
```
