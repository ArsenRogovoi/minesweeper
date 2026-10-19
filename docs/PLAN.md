# Plan

Each stage follows TDD and ends with `npm test`, `npm run lint`, `npm run format:check` passing.
Before starting a stage, check [DECISIONS.md](DECISIONS.md) for open questions tagged with that stage — ask the
owner first. Tick `[x]` when a task is done.

## Stage 0 — Environment and skeleton

- [x] Node.js 24 installed inside WSL via fnm (by the owner) — see CLAUDE.md “Environment”
- [ ] Add `.nvmrc` with `24`
- [ ] `git init`, `.gitignore` (`node_modules/`, `css/`, `coverage/`, `.env`, `.env.*`)
- [ ] `package.json` with scripts from CLAUDE.md; dev dependencies: sass, vitest, jsdom, @vitest/coverage-v8,
      eslint, @eslint/js, globals, eslint-config-prettier, prettier, + dev server tools (P2)
- [ ] ESLint flat config, Prettier config, Vitest config (coverage thresholds P4)
- [ ] Folder skeleton from REQUIREMENTS §2.2, empty `main.scss` with 7-1 folders, minimal `index.html`
- [ ] One trivial passing test to prove the pipeline

**Done when:** `npm run dev` serves the page with live reload; all checks pass.

## Stage 1 — Core: board

- [ ] Level presets (Beginner / Intermediate / Expert) and custom-size validation with XP clamping
- [ ] Board creation with injected `random()`; exact mine count, no duplicates
- [ ] Neighbour lookup (corners, edges) and adjacent-mine counts

**Done when:** board generation is deterministic in tests with a seeded random.

## Stage 2 — Core: game rules

- [ ] Game states: ready → playing → won / lost
- [ ] Open cell, flood fill on 0
- [ ] Mark cycle (flag / “?” / closed), with Marks on and off; flags block opening
- [ ] Chord: opens neighbours only when flag count matches; wrong flags lead to loss
- [ ] Win detection with auto-flagging; loss with exploded mine, revealed mines, wrong flags
- [ ] Mine counter (can be negative)
- [ ] Event / snapshot API for the UI

**Done when:** every rule in REQUIREMENTS §1.2 has a test.

## Stage 3 — Core: timer

- [ ] Timer with injected clock/scheduler: starts at first open, shows 1, +1 per second, stops at 999,
      stops on win/loss, resets on new game

## Stage 4 — Services

- [ ] Settings storage: load/save level, custom size, Marks, language; safe defaults on missing/broken data
- [ ] i18n: `ru` / `en` dictionaries, browser-language detection, `t(key)`, change-language event

## Stage 5 — Static layout and styles

- [ ] Resolve Q7
- [ ] SCSS 7-1 structure with variables (colours, sizes)
- [ ] Luna window frame with decorative buttons, menu bar, status panel, field container (static HTML)

**Done when:** the static page looks like the XP window (owner reviews a screenshot).

## Stage 6 — Graphics and rendering

- [ ] Resolve Q5
- [ ] SVG assets: mine, flag, “?”, crossed mine, smileys (4), LED digits 0–9 and minus, window buttons, icon
- [ ] Render field from core state (all cell states, number colours)
- [ ] Render LED counter, timer, smiley

## Stage 7 — Mouse input

- [ ] Resolve Q6
- [ ] Left press/move/release with pressed-cell feedback; open on release
- [ ] Right click mark cycle; context menu disabled on the field
- [ ] Chord via both buttons or middle button, with neighbour feedback
- [ ] Smiley reactions; smiley click and F2 start a new game

**Done when:** a full game can be played with the mouse at all three levels.

## Stage 8 — Menu and dialog

- [ ] Resolve Q2, Q3
- [ ] Game menu: open/close behaviour like XP, check marks, level switch, Marks toggle, language switch
- [ ] Custom dialog with validation and clamping
- [ ] Help menu (per Q2)
- [ ] Wire settings persistence and i18n into the UI

## Stage 9 — Touch

- [ ] Resolve Q4
- [ ] Tap = open, long press = mark cycle, tap on number = chord
- [ ] No context menu / text selection / accidental zoom on the field

## Stage 10 — Polish and review

- [ ] Side-by-side comparison with XP screenshots, fix visual differences
- [ ] README with how to run, play and test
- [ ] Final code review (`/code-review`), clean-up, coverage check
