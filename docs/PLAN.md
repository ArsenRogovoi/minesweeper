# Plan

Each stage follows TDD and ends with `npm test`, `npm run lint`, `npm run format:check` passing.
Before starting a stage, check [DECISIONS.md](DECISIONS.md) for open questions tagged with that stage — ask the
owner first. Tick `[x]` when a task is done.

## Stage 0 — Environment and skeleton

- [x] Node.js 24 installed inside WSL via fnm (by the owner) — see CLAUDE.md “Environment”
- [x] Add `.nvmrc` with `24`
- [x] `git init`, `.gitignore` (`node_modules/`, `css/`, `coverage/`, `.env`, `.env.*`)
- [x] `package.json` with scripts from CLAUDE.md; dev dependencies: sass, vitest, jsdom, @vitest/coverage-v8,
      eslint, @eslint/js, globals, eslint-config-prettier, prettier, + dev server tools (P2)
- [x] ESLint flat config, Prettier config, Vitest config (coverage thresholds P4)
- [x] Folder skeleton from REQUIREMENTS §2.2, empty `main.scss` with 7-1 folders, minimal `index.html`
- [x] One trivial passing test to prove the pipeline

**Done when:** `npm run dev` serves the page with live reload; all checks pass.

## Stage 1 — Core: board

- [x] Level presets (Beginner / Intermediate / Expert) and custom-size validation with XP clamping
- [x] Board creation with injected `random()`; exact mine count, no duplicates
- [x] Neighbour lookup (corners, edges) and adjacent-mine counts

**Done when:** board generation is deterministic in tests with a seeded random.

## Stage 2 — Core: game rules

- [x] Game states: ready → playing → won / lost
- [x] Open cell, flood fill on 0
- [x] Mark cycle (flag / “?” / closed), with Marks on and off; flags block opening
- [x] Chord: opens neighbours only when flag count matches; wrong flags lead to loss
- [x] Win detection with auto-flagging; loss with exploded mine, revealed mines, wrong flags
- [x] Mine counter (can be negative)
- [x] Event / snapshot API for the UI

**Done when:** every rule in REQUIREMENTS §1.2 has a test.

## Stage 3 — Core: timer

- [x] Timer with injected clock/scheduler: starts at first open, shows 1, +1 per second, stops at 999,
      stops on win/loss, resets on new game

## Stage 4 — Services

- [x] Settings storage: load/save level, custom size, Marks, language; safe defaults on missing/broken data
- [x] i18n: `ru` / `en` dictionaries, browser-language detection, `t(key)`, change-language event
- [x] Background setting (decision 29): `solid` / `gradient` in settings storage, texts in both dictionaries

## Stage 5 — Static layout and styles

- [x] Resolve Q7 (decision 29)
- [x] SCSS 7-1 structure with variables (colours, sizes)
- [x] Desktop background: solid XP colour and Bliss-like gradient, switched by a body class
- [x] Luna window frame with decorative buttons, menu bar, status panel, field container (static HTML)

**Done when:** the static page looks like the XP window (owner reviews a screenshot).

## Stage 6 — Graphics and rendering

- [x] Resolve Q5 (decision 33)
- [x] SVG assets: mine, flag, “?”, crossed mine, smileys (4), LED digits 0–9 and minus, window buttons, icon
- [x] Render field from core state (all cell states, number colours)
- [x] Render LED counter, timer, smiley

## Stage 7 — Mouse input

- [x] Resolve Q6 (decision 34)
- [x] Left press/move/release with pressed-cell feedback; open on release
- [x] Right click mark cycle; context menu disabled on the field
- [x] Chord via both buttons or middle button, with neighbour feedback
- [x] Smiley reactions; smiley click and F2 start a new game
- [x] Keyboard (decision 34): arrows move a cursor, Space opens / chords, F cycles flag and “?”

**Done when:** a full game can be played with the mouse (and the keyboard) at all three levels.

## Stage 8 — Menu and dialog

- [x] Resolve Q2, Q3 (decisions 35, 36)
- [x] Menu bar component: open/close behaviour like XP (click opens, hover switches, outside click and Esc close),
      check marks, separators, submenus, drawn from a model
- [x] Wire settings and i18n into the page: load settings at start, window title / language texts, desktop
      background class
- [x] Game menu: New (F2), levels, Marks (?), Language and Background submenus; save every change
- [x] Dialog component (XP style, modal) and the Custom field dialog with validation and clamping
- [x] Help menu: About and Rules dialogs (decision 35)

## Stage 9 — Touch

- [x] Resolve Q4 (decision 37)
- [x] Scale the window down to the screen width (`--fit`)
- [x] Tap = open, long press = mark cycle, tap on number = chord
- [x] No context menu / text selection / accidental zoom on the field

## Stage 10 — Polish and review

- [x] Side-by-side comparison with XP screenshots, fix visual differences
- [x] README with how to run, play and test
- [x] Final code review (`/code-review`), clean-up, coverage check

## Stage 11 — Publishing (GitHub Pages)

- [x] Check the repository and its history for personal or secret data (none found; decision 40)
- [x] GitHub Actions workflow: checks, CSS build, deploy to Pages (decisions 41, 42)
- [ ] Owner: make the repository public; Settings → Pages → Source: “GitHub Actions”; push
- [ ] Check the published site: styles, images, a full game
- [x] Resolve Q8: “unofficial” notice in the About dialog and in the README (decision 43)
- [x] Resolve Q9: MIT license (decision 45); README links to the site (decision 44)
