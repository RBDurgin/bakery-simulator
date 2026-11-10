# Bakery Simulator — Game Plan

A kid-friendly bakery game about baking, budgeting, and running a small shop.
This document is the agreed plan. Update it when a decision changes, and tick
off phases as they are finished.

## 1. Decisions made

| Topic | Decision |
| --- | --- |
| Audience | Ages 8–12. Short text, simple money math, icons alongside words. |
| Core loop | Day cycle at a relaxed pace: plan and shop → bake and serve → end-of-day report. |
| Difficulty | Easy, Medium, Hard, chosen when a new game starts. |
| Saves | Browser local storage, several save slots, autosave. |
| Tutorials | A first-day tutorial, plus a short tutorial each time a feature unlocks. |
| Tech stack | React + TypeScript + Vite. Vitest for unit tests, Playwright for e2e. |
| Art | Emoji and CSS first, behind an asset layer so real art can replace it later. |
| Layout | Mobile-first. Phone portrait is the primary target; tablet and desktop scale up. |
| Themes | Baking, budgeting, management. |
| Name | The game is "Bakery Simulator". The player names their bakery and their character. |
| End goal | Open-ended for now: no final win condition, the bakery keeps growing. |
| Language | English only. Text still lives in content files, not scattered through components. |
| Hosting | Vercel (most likely). |
| Narration | Optional, using the browser's built-in speech. Off by default; see 2.5. |

## 2. Game design

### 2.1 The day cycle

Each in-game day has three phases.

1. **Morning — plan and shop.** No clock. The player checks their money, buys
   ingredients, and decides what to bake. This is where budgeting happens.
2. **Open — bake and serve.** A gentle clock runs. The player puts recipes in
   the oven, takes them out when ready, and serves customers who ask for items.
   Customers wait patiently; how patiently depends on difficulty.
3. **Evening — report.** No clock. A simple report shows money earned, money
   spent, profit, what sold, what was wasted, and happy customers. The game
   autosaves here.

The clock pauses whenever a menu, tutorial, or the pause screen is open, and
when the browser tab is hidden.

### 2.2 The three themes

**Baking**
- Recipes need ingredients and oven time. Start with three (for example
  cookies, muffins, bread) and unlock more.
- Baked goods have a quality: taken out on time is best, late is "a bit
  crispy", very late is burnt.
- Later: more ovens, faster mixers, multi-step recipes, day-old goods that sell
  for less.

**Budgeting**
- Money is stored as whole cents and shown as dollars and cents.
- Ingredients cost money; goods sell for a price the player can set (from
  Phase 5).
- The evening report teaches income, cost, and profit in plain words.
- Later: daily rent and bills, savings goals for upgrades, a simple ledger and
  chart, and an optional loan on Medium and Hard.

**Management**
- Reputation (stars) rises with happy customers and falls with long waits or
  empty shelves. More stars bring more customers.
- Later: hire helpers (a baker, a cashier), buy equipment and shop upgrades,
  take special orders such as a birthday cake, and plan around events such as
  rainy days or a town fair.

### 2.3 Difficulty modes

All differences are numbers in one config table, so tuning never needs code
changes. Starting values, to be tuned by playtesting:

| Setting | Easy | Medium | Hard |
| --- | --- | --- | --- |
| Starting money | $100 | $60 | $40 |
| Customer patience | Very long | Normal | Short |
| Open-phase clock speed | Slow | Normal | Fast |
| Burn window after "ready" | Very wide | Normal | Narrow |
| Ingredient price changes | None | Small | Larger |
| Daily rent and bills | None | Low | Higher |
| Ingredient spoilage | Off | Slow | Normal |
| Hints | Always shown | On request | On request |
| Running out of money | Grandma gives a gift and a tip | A small loan to repay | A loan with a fee; three missed repayments ends the run |

Easy never ends in failure. Any "game over" on Hard is gentle and offers to
restart from the last saved day.

### 2.4 Progression and unlocks

The bakery levels up from reputation and total profit. Each level unlocks one
new thing, and each unlock triggers its tutorial. Planned order:

1. Start: three recipes, one oven, fixed prices.
2. New recipes (ongoing through the game).
3. Setting your own prices.
4. Second oven and equipment upgrades.
5. Rent and bills (Medium and Hard), savings goals.
6. Special orders.
7. Hiring a helper.
8. Events and seasons.

### 2.5 Tutorials

- A data-driven tutorial engine: each tutorial is a list of steps (text, an
  optional element to highlight, and what the player must do to continue).
- The first-day tutorial walks through one whole day with a friendly guide
  character.
- Unlock tutorials are short (three to five steps) and start the first time the
  feature appears.
- Every tutorial can be skipped and replayed later from a Help book.
- Which tutorials have been seen is stored in the save.
- Text aims at a reading level for age 8, at most two short sentences a step.
- Optional "read aloud" setting uses the browser's built-in speech (the Web
  Speech API) to speak tutorial text. It needs no audio files and adds almost
  no download size, because tutorials are already text data. Voice quality
  varies by device, and the button is hidden where speech is not available.
  Recorded voice-over is out of scope unless we decide otherwise later.

### 2.6 Kid-friendly rules

- No ads, no purchases, no accounts, no chat, no external links, no tracking.
  Nothing leaves the device.
- Encouraging tone; mistakes are explained, never punished harshly.
- Large touch targets (at least 44 px), high contrast, no flashing effects.
- Colour is never the only signal; icons and words back it up.
- Sound is optional and off-switchable; a reduced-motion setting is respected.

## 3. Technical design

### 3.1 Architecture

```
src/
  engine/      Pure TypeScript game rules. No React, no DOM, no clock of its own.
  content/     Data: recipes, ingredients, difficulty table, unlocks, tutorials.
  save/        Local storage, save schema, versioned migrations.
  store/       Thin state store that connects engine to UI.
  ui/          React screens and components.
  assets/      Asset layer: maps item ids to emoji now, images later.
  test/        Shared test helpers and fixtures.
e2e/           Playwright tests.
docs/          This plan and later design notes.
```

Key rules:

- **The engine is pure.** State in, action in, new state out. Time advances
  only through an explicit `tick(state, ms)` call, and randomness comes from a
  seeded generator stored in the state. This makes every rule unit-testable
  and every e2e run repeatable.
- **Content is data.** Adding a recipe, a tutorial, or tuning difficulty means
  editing a content file, not engine code.
- **State store:** Zustand, holding engine state and dispatching engine
  actions. UI components never change game state directly.
- **Styling:** CSS Modules with CSS custom properties for the theme. No UI
  framework.

### 3.2 Saves

- Three save slots plus settings, each under its own local storage key.
- Every save carries a `version`. Loading runs migrations in order up to the
  current version; each migration has a test with a stored fixture of the old
  format.
- Saves are validated on load. A damaged save is reported kindly and never
  crashes the game.
- Autosave at the end of each phase. An open phase that is interrupted resumes
  from the start of that day's morning.
- Storage errors (full or blocked storage) show a clear message and the game
  keeps running in memory.
- Later: export and import a save as a file, so a game can move between devices.

### 3.3 Mobile-first approach

- Design at 360 × 640 portrait first, then add breakpoints for tablet and
  desktop.
- Bottom navigation and thumb-reachable primary actions.
- Tap only: no hover-only or drag-only interactions (drag may be an optional
  extra with a tap alternative).
- Safe-area insets, no horizontal scrolling, dynamic viewport units.
- Performance budget: under 200 KB of JavaScript (gzipped) at first load, and
  smooth on a mid-range phone.

### 3.4 Testing strategy

| Layer | Tool | What it covers |
| --- | --- | --- |
| Unit | Vitest | Engine rules, economy maths, save migrations, tutorial engine. |
| Component | Vitest + React Testing Library | Screens and components in isolation. |
| End-to-end | Playwright | Full player journeys in a real browser. |
| Accessibility | @axe-core/playwright | Automated checks on every main screen. |
| Visual | Playwright screenshots | Key screens at phone and desktop sizes. |

- **Coverage targets:** 90% lines and branches for `engine/` and `save/`, 80%
  overall. CI fails below these.
- **Playwright projects:** phone portrait (Pixel-class, Chromium), phone
  (iPhone-class, WebKit), and desktop Chromium. Phone projects are the
  default; every journey runs on them.
- **Test hooks:** in test builds only, a URL parameter sets the random seed,
  the clock speed, and can load a prepared save, so e2e tests are fast and
  deterministic. Stable `data-testid` attributes on interactive elements.
- **CI:** GitHub Actions runs lint, type check, unit tests with coverage,
  build, and Playwright on every push and pull request.

### 3.5 Definition of done for every phase and sub-phase

A phase or sub-phase is finished only when all of these hold:

1. Features work on a phone-sized screen first, then desktop.
2. Unit and component tests are written, and coverage targets are met.
3. Playwright tests cover the new player journeys on the phone projects.
4. Accessibility checks pass on new screens.
5. Any new unlock has its tutorial.
6. Any save format change has a migration and a migration test.
7. Lint, type check, and the full test suite pass in CI.
8. This plan is updated: the phase is ticked off and any changed decisions are
   recorded.

## 4. Phases

### Phase 0 — Foundation

- [ ] **0.1 Project setup.** Vite + React + TypeScript, ESLint, Prettier,
  folder structure, npm scripts.
- [ ] **0.2 Test setup.** Vitest with coverage thresholds, React Testing
  Library, Playwright with the three projects, axe checks, one smoke test of
  each kind.
- [ ] **0.3 CI.** GitHub Actions workflow for lint, types, tests, build, e2e.
- [ ] **0.4 App shell.** Mobile-first layout, theme variables, asset layer,
  title screen placeholder.

*Tests:* smoke unit test, smoke e2e test that loads the title screen on phone
and desktop, axe check on the title screen.

### Phase 1 — Core loop (first playable)

- [ ] **1.1 Engine core.** Game state, seeded random numbers, `tick`, day
  phases, money, inventory, the first three recipes.
- [ ] **1.2 Morning screen.** Buy ingredients, see money and stock, start the
  day.
- [ ] **1.3 Open screen.** Bake in one oven, take goods out, customers arrive
  and are served, pause.
- [ ] **1.4 Evening report.** Income, costs, profit, sold and wasted items;
  continue to the next day.
- [ ] **1.5 Title and new game flow.** Title screen, new game where the
  player names their bakery and character (with friendly defaults and a
  length limit), basic reputation stars. The names appear on the shop sign,
  in reports, and in tutorial text.

*Tests:* unit tests for every engine rule; component tests per screen; e2e
journey "play one full day and see the correct profit" using a fixed seed.

### Phase 2 — Saves, difficulty, settings

- [ ] **2.1 Save system.** Versioned schema, validation, three slots,
  autosave, continue, delete with confirmation, storage error handling.
- [ ] **2.2 Difficulty modes.** Difficulty table wired into the engine,
  difficulty picker on new game, out-of-money handling per mode.
- [ ] **2.3 Settings.** Sound on/off, reduced motion, text size; stored
  separately from save slots.

*Tests:* migration and corrupted-save unit tests; unit tests proving each
difficulty value changes behaviour; e2e journeys "save, reload the page,
continue", "three slots stay separate", and one day on each difficulty.

### Phase 3 — Tutorials

- [ ] **3.1 Tutorial engine.** Step data format, highlighting, skip, progress
  stored in the save.
- [ ] **3.2 First-day tutorial.** Guided first day with the guide character.
- [ ] **3.4 Read aloud.** Optional setting that speaks tutorial text using
  the browser's built-in speech.
- [ ] **3.3 Unlock hooks and Help book.** Tutorials start on unlock events;
  replay any seen tutorial from Help.

*Tests:* unit tests for the tutorial engine; a content test that every unlock
has a tutorial and every tutorial step points at a real element; e2e journeys
for completing, skipping, and replaying the first-day tutorial.

### Phase 4 — Baking depth

- [ ] **4.1 Progression.** Bakery levels, the unlock system, more recipes.
- [ ] **4.2 Quality.** Perfect, crispy, and burnt results that affect price
  and reputation.
- [ ] **4.3 Equipment.** Second oven and upgrades bought with savings.
- [ ] **4.4 Freshness.** Ingredient spoilage and day-old goods (by
  difficulty).

*Tests:* unit tests for unlock rules, quality timing, and spoilage; e2e
journey from a prepared save that reaches a level-up and sees the unlock
tutorial.

### Phase 5 — Budgeting depth

- [ ] **5.1 Pricing.** Set prices; demand responds to price and reputation.
- [ ] **5.2 Bills.** Rent and bills on Medium and Hard, with a warning the day
  before.
- [ ] **5.3 Ledger and goals.** Money history, a simple chart, savings goals.
- [ ] **5.4 Loans.** Borrow and repay on Medium and Hard.

*Tests:* unit tests for demand, bills, and loan maths, including edge cases
around zero money; e2e journeys for changing a price and seeing sales change,
and for taking and repaying a loan.

### Phase 6 — Management depth

- [ ] **6.1 Customers.** Customer types with different tastes and patience.
- [ ] **6.2 Special orders.** Orders placed ahead with a deadline and bonus.
- [ ] **6.3 Helpers.** Hire a baker or cashier, pay wages, see what they
  automate.
- [ ] **6.4 Events.** Weather, town events, and seasons that change demand.

*Tests:* unit tests for each system; a long simulated-run test (many days
played by a simple scripted player) on each difficulty to catch balance and
dead-end bugs; e2e journeys for a special order and for hiring a helper.

### Phase 7 — Polish and release

- [ ] **7.1 Feel.** Sound effects, gentle animation, achievements and
  stickers.
- [ ] **7.2 Art upgrade.** Replace emoji with illustrations through the asset
  layer where wanted.
- [ ] **7.3 Offline and install.** Installable web app that works offline;
  save export and import.
- [ ] **7.4 Quality pass.** Full accessibility review, performance check
  against the budget, balance tuning from playtests with children.
- [ ] **7.5 Release.** Deploy to Vercel, with preview deployments for pull
  requests.

*Tests:* offline e2e test, export/import round-trip test, full visual
screenshot set, complete regression run on all Playwright projects.

## 5. Open questions

None at the moment. Things to revisit later:

1. Whether to add an end goal once the open-ended game is fun.
2. Whether browser speech is good enough for read aloud, or recorded
   voice-over is worth the extra work.
