# Bakery Simulator — Game Plan

A kid-friendly bakery game about baking, budgeting, and running a small shop.
This document is the agreed plan. Update it when a decision changes, and tick
off phases as they are finished.

## 1. Decisions made

| Topic | Decision |
| --- | --- |
| Audience | Ages 8–12. Short text, simple money math, icons alongside words. |
| Core loop | Day cycle at a relaxed pace: plan and shop → bake and serve → end-of-day report. |
| Presentation | The whole game is a small world the player walks around: the bakery, the street, the market, and later the bank. Menu panels open at the place where the job is done. See 2.7. |
| Movement | Tap to walk: tap a thing or a person and the baker walks there and does the job. No joystick, no free steering. |
| Difficulty | Easy, Medium, Hard, chosen when a new game starts. |
| Saves | Browser local storage, three save slots, autosave. |
| Tutorials | A first-day tutorial, plus a short tutorial each time a feature unlocks. |
| Tech stack | React + TypeScript + Vite. Vitest for unit tests, Playwright for e2e. |
| Art | Emoji and CSS first, behind an asset layer so real art can replace it later. This covers characters and places too. |
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

1. **Morning — plan and shop.** No clock. The baker wakes up at home, walks
   to the market, buys ingredients at the stalls, and walks to the bakery. This is where budgeting happens.
   Turning the door sign to "Open" starts the day.
2. **Open — bake and serve.** A gentle clock runs and the baker stays in the
   bakery. The player sends the baker to the oven to bake and take goods out,
   and to the counter to serve. Customers walk in, queue, and show what they
   want. They wait patiently; how patiently depends on difficulty.
3. **Evening — report.** No clock. The baker counts the till, which opens a
   simple report: money earned, money spent, profit, what sold, what was
   wasted, and happy customers. The game autosaves here. Going home to bed
   starts the next day.

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
  Phase 6).
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

### 2.7 The walkable world

Decided after Phase 1, which was built as flat menu screens. The game becomes
a small world with characters in it.

**Places**
- Each place is one room that fits the phone screen. There is no scrolling
  camera. Doors and paths lead from one room to the next.
- Starting places: the bakery (oven, shelf, counter, till, door), the street
  outside, the market (one stall for each ingredient), and home.
- Later places arrive with their features: the bank (savings and loans), a
  notice board (special orders and events).

**Moving**
- The player taps a thing or a person. The baker walks there along a simple
  path and then does the job. Tapping somewhere else changes the plan.
- Walking takes a little time. In the open phase that makes the order of jobs
  matter: a trip to the oven is a moment away from the counter. Walks are
  short (about a second between stations) so nothing feels slow.
- During the open phase the baker stays in the bakery.

**Characters**
- The player's baker, with a look chosen at the start of a new game.
- Customers who walk in, queue, show what they want in a bubble, and leave
  happy or grumpy.
- Townsfolk with jobs: stall keepers at the market, the guide character for
  tutorials, and later a banker and hired helpers who can be seen working.

**Panels**
- Jobs with numbers still use a panel: buying at a stall, the evening report,
  later prices and the ledger. A panel slides up at the place where the job is
  done and the clock pauses while it is open. The Phase 1 screens become these
  panels.
- Money, the clock and the stars stay on screen in every place.

**Rules that still hold**
- Everything that can be tapped is a real button with a name, so the game
  works with a keyboard and a screen reader. Arriving somewhere is announced.
- With reduced motion on, characters glide without bouncing or other effects.
  Walking still takes the same game time.

## 3. Technical design

### 3.1 Architecture

```
src/
  engine/      Pure TypeScript game rules. No React, no DOM, no clock of its own.
  content/     Data: recipes, ingredients, places, looks, difficulty table,
               unlocks, tutorials, and all player-facing text.
  save/        Local storage, save schema, versioned migrations.
  store/       Thin state store that connects engine to UI.
  ui/          React screens and components.
    scene/     Draws a place: its background, things to tap, and characters.
    panels/    Menu panels that open at a place (stall, report, and so on).
  assets/      Asset layer: maps item, character and place ids to emoji now,
               images later.
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
- **Places are data.** A place lists its spots (where a character can stand),
  the paths between them, and the things that can be tapped. Characters walk
  along paths from spot to spot; there is no free movement and no collision
  maths.
- **The engine knows where the baker is.** The baker's place, spot and
  current walk are engine state, and walking advances in `tick`, so the time
  a walk takes is a tested game rule and e2e runs stay repeatable. Purely
  decorative movement (a customer strolling out of the door, a walking bounce)
  belongs to the UI.
- **No game engine library.** Scenes are ordinary DOM elements moved with CSS
  transforms. A room holds about a dozen characters, which does not need a
  canvas, and it keeps real buttons, the accessibility checks, and the
  download budget. The scene code sits behind one component, so it can be
  swapped for a canvas renderer later if the world outgrows this.

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
- The scene fills the screen and everything in it is in thumb reach. Money,
  day, stars and the time sit above it; the message line and Pause sit below.
  There is no bottom navigation: moving between places is done by walking.
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

- [x] **0.1 Project setup.** Vite + React + TypeScript, ESLint, Prettier,
  folder structure, npm scripts.
- [x] **0.2 Test setup.** Vitest with coverage thresholds, React Testing
  Library, Playwright with the three projects, axe checks, one smoke test of
  each kind.
- [x] **0.3 CI.** GitHub Actions workflow for lint, types, tests, build, e2e.
- [x] **0.4 App shell.** Mobile-first layout, theme variables, asset layer,
  title screen placeholder.

*Tests:* smoke unit test, smoke e2e test that loads the title screen on phone
and desktop, axe check on the title screen.

*Done.* Notes from building it:

- TypeScript is pinned to 6.0.x because typescript-eslint does not support
  TypeScript 7 yet. Revisit when it does.
- `@playwright/test` is pinned to an exact version, and an npm override keeps
  `@axe-core/playwright` on the same `playwright-core`.
- Zustand is added in Phase 1, when there is state to hold.
- Visual screenshot tests start once real screens exist (Phase 1), so the
  baselines are worth keeping.
- `src/engine/money.ts` (whole-cent formatting) is the first engine module. An
  ESLint rule keeps `engine/` free of React, the DOM, timers, `Math.random`
  and `Date.now`.

### Phase 1 — Core loop (first playable)

- [x] **1.1 Engine core.** Game state, seeded random numbers, `tick`, day
  phases, money, inventory, the first three recipes.
- [x] **1.2 Morning screen.** Buy ingredients, see money and stock, start the
  day.
- [x] **1.3 Open screen.** Bake in one oven, take goods out, customers arrive
  and are served, pause.
- [x] **1.4 Evening report.** Income, costs, profit, sold and wasted items;
  continue to the next day.
- [x] **1.5 Title and new game flow.** Title screen, new game where the
  player names their bakery and character (with friendly defaults and a
  length limit), basic reputation stars. The names appear on the shop sign,
  in reports, and in tutorial text.

*Tests:* unit tests for every engine rule; component tests per screen; e2e
journey "play one full day and see the correct profit" using a fixed seed.

*Done.* Notes from building it:

- The engine is `src/engine/`: `createGame`, `applyAction(state, action)` and
  `tick(state, ms)`. An action that is not allowed returns the same state, so
  the UI can never break a rule. `tick` gives the same result whether time
  passes in one big step or many small ones.
- Customer order depends only on the seed, never on how fast the player is.
  Random numbers are drawn even when the queue is full and a customer walks
  past.
- Until the difficulty table arrives (Phase 3.2), one set of numbers in
  `src/content/balance.ts` is used, based on the planned Medium values: $60
  to start, a 3-minute open phase, 60 s customer patience, a 30 s burn window.
- Starter content: four ingredients (flour, sugar, butter, egg) and three
  recipes (cookies, muffins, bread). Each customer wants one item.
- Simple versions of later features, to be deepened in their own phases: a
  batch left too long burns and is wasted (quality, 5.2); goods left at
  closing time are wasted (day-old goods, 5.4); ingredients keep overnight.
- Reputation is a 0–100 score shown as one to five stars. A happy customer
  adds 2, a customer who gives up waiting takes away 3, and more stars bring
  customers a little sooner. Customers still waiting at closing time do not
  count against the player.
- The shop can be closed early, but only from the pause screen, so it cannot
  be tapped by accident.
- The game also pauses itself when the browser tab is hidden.
- Test hooks (`?seed=42&speed=5`) work only in builds made with
  `VITE_TEST_HOOKS=true`, which the Playwright config sets. Normal builds
  ignore them.
- Known gap: a player who spends all their money and sells nothing has no way
  to recover. Out-of-money handling is Phase 3.2.
- Nothing is saved yet: reloading the page starts over (Phase 3.1).
- Visual screenshot tests are still not started. Baselines must be made on
  the same system CI uses (fonts and emoji differ between machines), so they
  need a CI job that can update them. Moved to Phase 3.

### Phase 2 — The walkable world

Comes before saves so the save format is designed once, with places and
positions already in the game state.

- [x] **2.1 Scene foundation.** Place data format (spots, paths, things to
  tap). Engine state for where the baker is, a walk-to action, and walking in
  `tick`. Scene component, character component, tap to walk, arrival
  announcements, reduced motion.
- [x] **2.2 Bakery scene.** The open phase played in the bakery: walk to the
  oven, shelf and counter; customers walk in, queue, show an order bubble and
  leave. Replaces the Phase 1 open screen.
- [x] **2.3 Street and market.** The street outside and a market with a stall
  for each ingredient. Morning shopping happens at the stalls; the door sign
  opens the shop. Replaces the Phase 1 morning screen.
- [x] **2.4 Evening and home.** Closing up, counting the till to open the
  report panel, going home to start the next day. Replaces the Phase 1
  evening screen.
- [x] **2.5 Character looks.** Choose the baker's look in the new game flow;
  varied looks for customers and townsfolk through the asset layer.

*Tests:* unit tests for walking (paths, changing destination mid-walk, same
result in one big tick or many small ones) and a content test that every
place's paths and tappable things are valid; component tests for the scene
and each panel; the "play one full day" e2e journey redone in the world, on
the phone projects, with keyboard-only and axe checks on each place.

*Done.* Notes from building it:

- **Places** are data in `src/content/places.ts`: home, street, market and
  bakery. Positions are percentages of the room, so a room stretches to fit
  any screen. A content test checks every place: spots joined up, things on
  real spots, doors that lead somewhere with a way back.
- **One action moves the baker:** `tap`, aimed at a thing or a customer. The
  baker walks along the paths and the job is done on arriving, never before.
  Tapping somewhere else mid-walk carries on to the next spot or turns back,
  whichever is quicker. Walking is 20 ms for each unit of distance, so about
  half a second between stations next to each other and about 1.4 seconds
  from the oven to the till.
- **Jobs** are decided by the engine from what the thing is and the time of
  day: doors, stalls, oven, shelf, counter, till, sign, bed. Taking a batch
  out and serving are no longer actions of their own; they happen when the
  baker reaches the oven or the counter.
- **Walking takes time in every phase.** `tick` now moves the baker in the
  morning and evening too, while the shop clock still runs only when the shop
  is open. The Phase 1 rule holds: one big tick gives the same result as many
  small ones, including a walk that ends in a panel part of the way through.
- **Panels are engine state** (`panel`), separate from `paused`. Time stops
  for either, and closing one never undoes the other. Buying needs the stall's
  panel open and baking needs the oven's, so neither can be done from across
  the room.
- **Messages:** the engine records what just happened as a small piece of
  data (`message`) and `src/ui/scene/messageText.ts` puts it into words. The
  line under the scene shows it and screen readers announce it. This is how
  arrivals are announced, and it stands in for hints until the tutorials
  (Phase 4).
- **Rules added for the world:**
  - The baker wakes up at home each morning, day one included.
  - The door keeps the baker in the bakery while the shop is open.
  - In the evening the till must be counted before the baker can leave, so
    the report is never skipped. Going to bed starts the next day.
  - Turning the sign with nothing to bake asks first; a second tap opens the
    shop anyway. This replaces the Phase 1 morning tip.
  - Tapping the counter serves whoever has waited longest and can be served.
    Tapping a customer serves that one.
  - A customer can be tapped even when their order is not on the shelf. The
    baker walks over and the message says what is missing.
  - Market stalls sell only in the morning.
- **Layout:** Pause sits next to the message line under the scene instead of
  in a bottom bar, so a whole room fits a 360 × 640 screen. The close button
  of a panel stays in view while its contents scroll.
- **Customers walking in and out is decoration.** The store keeps the last
  few customers who left (`src/store/leaving.ts`) so the scene can show them
  walking out happy or grumpy. The engine knows nothing about it.
- **Looks:** six baker looks, picked on the new game form and kept in the
  game state as `bakerLook`. A customer's look comes from their number, so it
  needs nothing stored. Stall keepers have fixed looks.
- **Place backgrounds** are plain colours from `theme.css`, set per place in
  the scene's stylesheet. They are not in the asset layer yet; that moves
  with the art upgrade (8.2).
- **Reduced motion** follows the system setting for now: no bounce, and
  customers appear in place. The baker still moves, because the position
  comes from the engine. The in-game setting is Phase 3.3.
- **Keyboard:** the keyboard-only e2e journey runs on the Chromium projects.
  Safari only stops on buttons with Tab when a system setting is on, so it is
  skipped on the WebKit project; the tap journey and axe checks still run
  there.
- For the save format (3.1): `baker`, `bakerLook`, `panel`, `message` and
  `tillCounted` are new parts of the game state.

### Phase 3 — Saves, difficulty, settings

- [x] **3.1 Save system.** Versioned schema, validation, three slots,
  autosave, continue, delete with confirmation, storage error handling.
- [x] **3.2 Difficulty modes.** Difficulty table wired into the engine,
  difficulty picker on new game, out-of-money handling per mode.
- [x] **3.3 Settings.** Sound on/off, reduced motion, text size; stored
  separately from save slots.
- [x] **3.4 Visual tests.** Screenshot baselines for the key screens at phone
  and desktop sizes, made and updated by a CI job.

*Tests:* migration and corrupted-save unit tests; unit tests proving each
difficulty value changes behaviour; e2e journeys "save, reload the page,
continue", "three slots stay separate", and one day on each difficulty.

*Done.* Notes from building it:

- **Flow:** Title → save slots → new game form (for an empty slot) or
  straight into the game. The title also has Settings. In the game a Menu
  button sits where Pause is during shop hours; both open the same dialog,
  with Settings and a way back to the title.
- **Save format** (`src/save/`): one local storage key for each slot, holding
  `version`, the game, and the game as it was when the baker woke up that
  day. Version 1 is the first format, so there are no migrations yet; the
  step runner is tested with made-up old formats. When the format changes,
  follow the note in `migrations.ts`.
- **Loading checks every part** of a save and builds a clean game from it.
  Anything unknown is dropped; anything wrong makes the slot "broken", which
  the slots screen says kindly and offers to delete. A walk, an open panel
  and a pause are never kept.
- **Autosave points:** a new game, the shop opening (end of the morning), the
  shop closing, the till being counted, and going to bed. Outside shop hours
  the game also saves when the player leaves from the menu or the browser
  tab is hidden, so a phone that drops the tab loses nothing.
- **An open shop is never saved part-way.** The save made at opening time is
  loaded as that day's morning: the baker is at home again with the money
  and ingredients they had when the shop opened. The pause screen warns
  about this before leaving.
- **Storage errors:** if a save cannot be stored, a line under the scene says
  so and the game carries on in memory. Blocked storage reads as empty slots.
- **Difficulty table** is `src/content/difficulty.ts`; `balance.ts` keeps
  only the numbers every mode shares. Wired in so far:

  | Setting | Easy | Medium | Hard |
  | --- | --- | --- | --- |
  | Starting money | $100 | $60 | $40 |
  | Customer patience (shop clock) | 120 s | 60 s | 40 s |
  | Shop clock speed | 0.75× | 1× | 1.25× |
  | Burn window (shop clock) | 60 s | 30 s | 15 s |
  | Out of money | $20 gift | $20 loan | $20 loan + $5 fee |

  The other rows of the table in 2.3 join it with their features: price
  changes (6.1), bills (6.2), spoilage (5.4), hints (Phase 4).
- **Clock speed** changes the shop clock only: closing time, baking,
  customers arriving and their patience. Walking is never sped up, so on
  Hard a trip across the shop costs more shop time. A shop day lasts 4 real
  minutes on Easy, 3 on Medium and about 2½ on Hard.
- **Out of money** means waking up unable to pay for one batch of anything,
  counting what is in the cupboard. It is checked each morning. Easy:
  Grandma sends a gift and a tip. Medium and Hard: the bank lends money, and
  counting the till pays back $5 each evening. A repayment that cannot be
  paid in full is missed and the money is kept. On Hard the third miss ends
  the run (misses are cleared when the loan is paid off); the game-over
  dialog offers the day again from its morning. Medium never ends.
- Repayments are not a cost, so they do not change the day's profit. The
  report shows them on their own card. This is the simple version of loans;
  the bank as a place, and choosing to borrow, is still 6.4.
- **Settings** (`bakery-simulator.settings`): sound, less movement, text
  size. Less movement follows the device until the player chooses. The app
  puts `data-motion` and `data-text-size` on the page and `theme.css` does
  the rest; text size scales the root font size, and everything is in rem.
- **Sound:** a few short notes made with the Web Audio API (a sale, a batch
  ready, a burnt batch, opening and closing), so the sound setting has
  something to switch. No audio files. The full set of sounds is still 8.1.
- **Visual tests:** `e2e/visual.spec.ts`, twelve still screens at phone and
  desktop size, in their own Playwright projects (`npm run e2e:visual`).
  Baselines are made on CI by the "Visual baselines" workflow, started by
  hand or by `[visual-baselines]` in a commit message, which commits the
  pictures to the branch. CI skips the screenshot tests while a branch has
  no baselines. Screens with a running clock are left out.
- **Prepared saves for e2e** are built in `e2e/saves.ts` with the game's own
  engine and put into local storage before the page loads, so no test hook
  was needed for loading a save.
- New parts of the game state: `difficulty`, `loan`, `ended`, and `repaid`
  and `missedRepayment` in the day's numbers.

### Phase 4 — Tutorials

- [ ] **4.1 Tutorial engine.** Step data format, highlighting, skip, progress
  stored in the save.
- [ ] **4.2 First-day tutorial.** Guided first day with the guide character,
  who appears in the world and walks with the player.
- [ ] **4.3 Unlock hooks and Help book.** Tutorials start on unlock events;
  replay any seen tutorial from Help.
- [ ] **4.4 Read aloud.** Optional setting that speaks tutorial text using
  the browser's built-in speech.

*Tests:* unit tests for the tutorial engine; a content test that every unlock
has a tutorial and every tutorial step points at a real element; e2e journeys
for completing, skipping, and replaying the first-day tutorial.

### Phase 5 — Baking depth

- [ ] **5.1 Progression.** Bakery levels, the unlock system, more recipes.
- [ ] **5.2 Quality.** Perfect, crispy, and burnt results that affect price
  and reputation.
- [ ] **5.3 Equipment.** Second oven and upgrades bought with savings.
- [ ] **5.4 Freshness.** Ingredient spoilage and day-old goods (by
  difficulty).

*Tests:* unit tests for unlock rules, quality timing, and spoilage; e2e
journey from a prepared save that reaches a level-up and sees the unlock
tutorial.

### Phase 6 — Budgeting depth

- [ ] **6.1 Pricing.** Set prices; demand responds to price and reputation.
- [ ] **6.2 Bills.** Rent and bills on Medium and Hard, with a warning the day
  before.
- [ ] **6.3 Ledger and goals.** Money history, a simple chart, savings goals.
- [ ] **6.4 Loans.** Borrow and repay on Medium and Hard, at a new place:
  the bank.

*Tests:* unit tests for demand, bills, and loan maths, including edge cases
around zero money; e2e journeys for changing a price and seeing sales change,
and for taking and repaying a loan.

### Phase 7 — Management depth

- [ ] **7.1 Customers.** Customer types with different tastes and patience.
- [ ] **7.2 Special orders.** Orders placed ahead with a deadline and bonus.
- [ ] **7.3 Helpers.** Hire a baker or cashier, pay wages, and watch them
  work in the bakery.
- [ ] **7.4 Events.** Weather, town events, and seasons that change demand.

*Tests:* unit tests for each system; a long simulated-run test (many days
played by a simple scripted player) on each difficulty to catch balance and
dead-end bugs; e2e journeys for a special order and for hiring a helper.

### Phase 8 — Polish and release

- [ ] **8.1 Feel.** Sound effects, gentle animation, achievements and
  stickers.
- [ ] **8.2 Art upgrade.** Replace emoji with illustrations through the asset
  layer where wanted, including characters and place backgrounds.
- [ ] **8.3 Offline and install.** Installable web app that works offline;
  save export and import.
- [ ] **8.4 Quality pass.** Full accessibility review, performance check
  against the budget, balance tuning from playtests with children.
- [ ] **8.5 Release.** Deploy to Vercel, with preview deployments for pull
  requests.

*Tests:* offline e2e test, export/import round-trip test, full visual
screenshot set, complete regression run on all Playwright projects.

## 5. Open questions

None at the moment. Things to revisit later:

1. Whether to add an end goal once the open-ended game is fun.
2. Whether browser speech is good enough for read aloud, or recorded
   voice-over is worth the extra work.
3. Whether to add arrow-key walking on desktop as an extra to tap to walk.
4. Whether DOM scenes stay fast enough as the world grows, or a canvas
   renderer is needed (see 3.1).
