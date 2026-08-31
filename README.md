# Show IT ⚓

A mobile-first CampusCup spectator frontend, intended for **https://show.campuscup.dk** on Vercel.

It never calls Judge IT, Convex, or the authenticated `/stats` endpoint from a browser.

## Routes

- `/drink/` — year-wide Beer rankings across every heat
- `/spin/` — year-wide ten-revolution RPM rankings across every heat
- `/sail/` — year-wide Sail time rankings across every heat

## Architecture

```text
Convex schema → authenticated judge-it-stats generator → public static JSON → Vercel CDN → spectators
```

The public projections protect Judge IT from spectator traffic. The UI shows each publication timestamp, refreshes activity rankings every minute, and marks data stale after seven minutes.

## Schema reference

`schema/` is a pinned HTTPS submodule of [`itu-campuscup/schema`](https://github.com/itu-campuscup/schema), aligned to the stats generator. It is **reference only**. It must never be imported into the browser bundle because it contains server-side Convex code and the protected `/stats` endpoint.

```bash
git submodule update --init --recursive
# Intentional upgrade only:
git submodule update --remote --merge schema
```

## Public data contract

Show IT consumes `index.json` plus `rankings/{year}/{beer|spin|sail}.json` for the three ranking pages. These are the same year-wide ranking projections used by the official Judge IT stats views.

The home page separately consumes `current-heat.json` for current-heat status and summary counts. Its versioned contract and relay rules are documented in [`docs/current-heat-snapshot.md`](docs/current-heat-snapshot.md).

Override the source for local/staging work with `NEXT_PUBLIC_STATS_BASE_URL`.

## Deploy to Vercel

1. Import `itu-campuscup/show-it` into the appropriate Vercel team.
2. Set production branch to `main`.
3. Add the domain **`show.campuscup.dk`** to the project.
4. Apply the DNS record Vercel presents for that hostname. It is normally a CNAME to `cname.vercel-dns.com`.
5. Vercel detects `vercel.json`, runs `bun run build`, and deploys the Next.js output at the subdomain root. No GitHub Pages base path is used.

## Local development

```bash
git submodule update --init --recursive
bun install --backend copyfile
bun dev
```

On Android/Termux, build with Webpack:

```bash
node node_modules/next/dist/bin/next build --webpack
```
