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
| `npm run e2e`           | Run Playwright on all projects (`e2e:phone` for phones only). |
| `npm run check`         | Everything CI runs except Playwright.                         |

Playwright builds the game with `VITE_TEST_HOOKS=true`. Only in that build,
`?seed=42&speed=5` in the URL fixes the random seed and speeds up the clock.
Locally Playwright reuses a server already running on port 4173, so stop any
`npm run preview` first: a normal build ignores the test hooks and the
journeys time out.

The first time you run Playwright locally, install its browsers with
`npx playwright install chromium webkit`.

## Layout

```
src/engine/   Pure game rules (no React, no DOM, no timers)
src/content/  Game data (recipes, ingredients, places, looks) and player-facing text
src/save/     Local storage saves and migrations
src/store/    State store connecting engine and UI
src/ui/       React screens and components
  scene/      Draws a place: its background, things to tap, and characters
  panels/     Menu panels that open at a place (stall, oven, report)
src/assets/   Asset layer: item, character and place ids to emoji now, images later
src/test/     Shared test setup and helpers
e2e/          Playwright tests
```
