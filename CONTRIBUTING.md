# Contributing to Show IT

Thanks for helping improve the CampusCup spectator experience. Contributions of code, tests, documentation, and useful issue reports are welcome.

## Table of contents

- [Questions](#questions)
- [Reporting bugs](#reporting-bugs)
- [Suggesting enhancements](#suggesting-enhancements)
- [Your first contribution](#your-first-contribution)
- [Requirements and setup](#requirements-and-setup)
- [Architecture invariants](#architecture-invariants)
- [Making changes](#making-changes)
- [Documentation](#documentation)
- [Branch naming](#branch-naming)
- [Conventional Commits](#conventional-commits)
- [Pull request checklist](#pull-request-checklist)
- [Contact and security reporting](#contact-and-security-reporting)

## Questions

Search the existing [issues](https://github.com/itu-campuscup/show-it/issues) first. If your question is not answered there, [open an issue](https://github.com/itu-campuscup/show-it/issues/new) with the relevant Bun, operating system, browser, and reproduction context.

## Reporting bugs

Before opening a bug report:

- Reproduce the problem against the latest `main` when possible.
- Search [existing bug reports](https://github.com/itu-campuscup/show-it/issues?q=is%3Aissue+label%3Abug) for duplicates.
- Record the route, requested year (if relevant), expected behavior, actual behavior, and steps to reproduce.
- Include relevant runtime versions and error output, but remove secrets and private data.

[Open a bug report](https://github.com/itu-campuscup/show-it/issues/new?labels=bug) with that information.

## Suggesting enhancements

Search [existing enhancement requests](https://github.com/itu-campuscup/show-it/issues?q=is%3Aissue+label%3Aenhancement) first. A useful proposal explains the current behavior, the desired behavior, why it helps spectators or contributors, and any alternatives you considered.

[Suggest an enhancement](https://github.com/itu-campuscup/show-it/issues/new?labels=enhancement).

## Your first contribution

Start with an issue that interests you, or open one to discuss a larger change before coding. Fork or clone the repository, create a branch using the convention below, and follow [Requirements and setup](#requirements-and-setup).

No CampusCup Convex access is needed to contribute to Show IT. The app consumes the public JSON projections from `judge-it-stats`; contributors should not connect this repository to Judge IT, Convex, or the protected `/stats` endpoint.

## Requirements and setup

Show IT uses [Bun](https://bun.com/) for its package scripts and development workflow.

```bash
git clone --recurse-submodules https://github.com/itu-campuscup/show-it.git
cd show-it
git submodule update --init --recursive
bun install --backend copyfile
bun dev
```

The local app runs at [http://localhost:3000](http://localhost:3000). For local or staging data, set `NEXT_PUBLIC_STATS_BASE_URL` to a compatible static JSON source. Do not add credentials or protected service URLs to the client.

## Architecture invariants

Keep these boundaries intact:

- Show IT reads only static JSON published by [judge-it-stats](https://github.com/itu-campuscup/judge-it-stats) on GitHub Pages.
- Browser clients never call Judge IT, Convex, or the protected `/stats` endpoint.
- The `schema/` submodule is reference-only and must not be imported into the browser bundle.
- The homepage, ranking views, and team comparison poll published JSON every minute and mark publications older than seven minutes as stale.
- Ranking and team data remain year-scoped through `index.json`, `rankings/{year}/…`, and `teams/{year}/index.json`.

Changes to data consumed from [`judge-it-stats`](https://github.com/itu-campuscup/judge-it-stats) must be coordinated with that publisher. Changes to `current-heat.json` must also update [`docs/current-heat-snapshot.md`](docs/current-heat-snapshot.md).

## Making changes

1. Create a branch using [Branch naming](#branch-naming).
2. Start the app with `bun dev` and make the smallest focused change that solves the issue.
3. Keep routes, public data boundaries, and year-selection behavior consistent with the architecture invariants.
4. Add or update focused tests for changed behavior.
5. Run the required checks:

   ```bash
   bun test
   bun run build
   ```

6. Commit with [Conventional Commits](#conventional-commits), push your branch, and open a pull request against `main`.

## Documentation

Keep README instructions, route descriptions, setup commands, and public data-contract notes accurate when behavior changes. If a public snapshot contract changes, update [`docs/current-heat-snapshot.md`](docs/current-heat-snapshot.md) and coordinate the matching publisher change in [`judge-it-stats`](https://github.com/itu-campuscup/judge-it-stats).

## Branch naming

Use a lowercase type, optional issue or task ID, and a short kebab-case description:

```text
<type>/<task-id>-<description>
```

Examples:

```text
feat/123-add-ranking-filter
fix/456-mark-stale-snapshots
docs/update-public-contract
```

Common types are `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`.

## Conventional Commits

Commit messages are required to use this format:

```text
<type>(<scope>): <imperative description>
```

Use a lowercase type, keep the description imperative and concise, and do not use emoji. Examples:

```text
feat(rankings): add year selector
fix(snapshot): mark old data stale
docs: clarify public data boundary
```

## Pull request checklist

Before requesting review, confirm that:

- [ ] The pull request targets `main`.
- [ ] The change is focused and its description explains the user-visible effect.
- [ ] `bun test` passes.
- [ ] `bun run build` passes.
- [ ] Data contract changes are coordinated with `judge-it-stats`; `current-heat.json` changes are also documented in [`docs/current-heat-snapshot.md`](docs/current-heat-snapshot.md).
- [ ] Documentation and tests are updated where needed.
- [ ] No credentials, protected URLs, or generated files are included.

## Contact and security reporting

For general contact, use a [GitHub issue](https://github.com/itu-campuscup/show-it/issues) or email [contact@campuscup.dk](mailto:contact@campuscup.dk). Do not report security vulnerabilities in a public issue. Send sensitive security reports privately to [contact@campuscup.dk](mailto:contact@campuscup.dk) with enough detail to reproduce the problem.
