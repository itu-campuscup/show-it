# Show IT ⚓

Mobile-first spectator view for the current CampusCup heat.

## Data contract

Show IT uses the same public Convex queries as `judge-it`:

- `queries:getPlayers`
- `queries:getTeams`
- `queries:getHeats`
- `queries:getTimeTypes`
- `queries:getTimeLogs`

Set `NEXT_PUBLIC_CONVEX_URL` to the Judge IT Convex deployment URL. The site polls every three seconds. The Convex deployment must permit the deployed Show IT origin via its CORS configuration.

## Local development

```bash
bun install --backend copyfile
NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud bun dev
```

On Android/Termux, build with Webpack because Turbopack lacks Android/ARM64 support:

```bash
node node_modules/next/dist/bin/next build --webpack
```

## Semantics mirrored from Judge IT

- Beer and Spin events pair a player’s start and end timestamps in the current heat.
- Spin uses 10 revolutions and displays `600000 / elapsedMilliseconds` RPM.
- Sail shows raw Sail logs per team. A team wins at 16 logs.
