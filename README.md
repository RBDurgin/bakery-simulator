# Bakery Simulator

A kid-friendly bakery game about baking, budgeting, and running a small shop.
See [docs/PLAN.md](docs/PLAN.md) for the game design and the phase plan.

## Getting started

Needs Node 22 or newer.

```sh
npm install
npm run dev
```

## Scripts

| Script                  | What it does                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Start the dev server.                                         |
| `npm run build`         | Type check and build for production into `dist/`.             |
| `npm run preview`       | Serve the production build.                                   |
| `npm run lint`          | Run ESLint.                                                   |
| `npm run format`        | Format with Prettier (`format:check` only checks).            |
| `npm run typecheck`     | Run the TypeScript compiler without emitting.                 |
| `npm test`              | Run unit and component tests once (`test:watch` to watch).    |
| `npm run test:coverage` | Run tests with coverage; fails below the targets in the plan. |
| `npm run e2e`           | Run the Playwright journeys (`e2e:phone` for phones only).    |
| `npm run e2e:visual`    | Run the screenshot tests. See "Screenshot tests" below.       |
| `npm run check`         | Everything CI runs except Playwright.                         |

Playwright builds the game with `VITE_TEST_HOOKS=true`. Only in that build,
`?seed=42&speed=5` in the URL fixes the random seed and speeds up the clock.
Locally Playwright reuses a server already running on port 4173, so stop any
`npm run preview` first: a normal build ignores the test hooks and the
journeys time out.

The first time you run Playwright locally, install its browsers with
`npx playwright install chromium webkit`.

## Screenshot tests

`e2e/visual.spec.ts` compares the key screens with baseline pictures in
`e2e/__screenshots__`, at phone and desktop sizes. Fonts and emoji differ
between machines, so the baselines are made on CI only and the tests are not
part of `npm run e2e`. Running `npm run e2e:visual` on your own machine will
usually show differences; do not commit baselines made locally.

When a screen is meant to look different, remake the baselines with the
**Visual baselines** workflow. It takes new screenshots and commits them to
the branch. Start it in one of two ways:

- On GitHub: Actions → Visual baselines → Run workflow, and pick the branch.
- From a commit: put `[visual-baselines]` in the commit message and push.

Look at the changed pictures in the pull request before merging. The CI run
skips the screenshot tests while a branch has no baselines yet.

## Saves and settings

The game saves itself into the browser's local storage: three save slots
(`bakery-simulator.save.1` to `.3`) and the settings
(`bakery-simulator.settings`). Nothing leaves the device. Every save has a
version number; see `src/save/migrations.ts` before changing the save format.

## Layout

```
src/engine/   Pure game rules (no React, no DOM, no timers)
src/content/  Game data (recipes, ingredients, places, looks, difficulty) and player-facing text
src/save/     Local storage: save slots, settings, checks and migrations
src/store/    State store connecting engine and UI
src/ui/       React screens and components
  scene/      Draws a place: its background, things to tap, and characters
  panels/     Menu panels that open at a place (stall, oven, report) and Settings
src/assets/   Asset layer: item, character and place ids to emoji now, images later
src/test/     Shared test setup and helpers
e2e/          Playwright tests
```
