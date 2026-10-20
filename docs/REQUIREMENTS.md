# Requirements

Reference: Minesweeper as shipped with Windows XP. When this document is silent on a detail, the XP behaviour
is the target — but the agent must ask the owner before implementing anything not written here.

## 1. Functional requirements

### 1.1 Levels

| Level        | RU            | Width × Height | Mines |
| ------------ | ------------- | -------------- | ----- |
| Beginner     | Новичок       | 9 × 9          | 10    |
| Intermediate | Любитель      | 16 × 16        | 40    |
| Expert       | Профессионал  | 30 × 16        | 99    |
| Custom       | Особые…       | user-defined   | —     |

Custom dialog (XP limits): Height 9–24, Width 9–30, Mines 10 to (Height − 1) × (Width − 1).
Out-of-range values are clamped to the nearest limit (as in XP). Buttons: OK / Cancel.

Changing the level starts a new game and resizes the window to fit the field.

### 1.2 Game rules

- Mines are placed randomly when a new game starts. **No first-click protection** (deliberate deviation).
- Left click on a closed cell opens it:
  - mine → game lost;
  - number 1–8 → shows the count of adjacent mines;
  - 0 → shows an empty cell and recursively opens all neighbours (flood fill).
- Flagged cells cannot be opened by a click. Cells with “?” can.
- Right click cycles a closed cell: closed → flag → “?” → closed. When Marks (?) is off: closed → flag → closed.
- **Chord**: pressing both buttons (or the middle button) on an opened number. On release, if the number of
  adjacent flags equals the number, all adjacent non-flagged closed cells are opened (a wrong flag can make you
  lose). Otherwise nothing happens.
- **Win**: all non-mine cells are opened. Remaining mines are auto-flagged, mine counter shows 000, timer stops.
- **Loss**: the clicked mine is shown on a red background, all other mines are revealed, wrongly placed flags are
  shown as a crossed-out mine, timer stops, the field ignores input until a new game.

### 1.3 Mouse behaviour (visual feedback like XP)

- While the left button is held on a closed cell, that cell appears pressed; moving the mouse moves the pressed
  look; the cell opens on release. Releasing outside the field does nothing.
- While chording, the cell and its closed neighbours appear pressed.
- The smiley shows the “surprised” face (:o) while a button is held on the field.

### 1.4 Status panel

- **Mine counter** (left, red 7-segment LED, 3 digits): mines − flags. May go negative (shown with a minus sign).
- **Timer** (right, same style): starts at the first open action and shows 1, increases every second, stops at 999.
- **Smiley** (centre): normal 🙂, surprised :o, lost (dead), won (sunglasses). Clicking it starts a new game.

### 1.5 Window and menu

- Window in the Windows XP Luna style: blue title bar with an icon, title “Сапёр” / “Minesweeper”, and
  minimise / maximise / close buttons that are **decorative** (no action). The window is centred and not draggable.
- Menu bar: **Game** and **Help**.
- Game menu: New (F2) · Beginner · Intermediate · Expert · Custom… · Marks (?) · Language: Русский / English.
  The current level and enabled Marks have a check mark.
- Help menu contents: see open questions in [DECISIONS.md](DECISIONS.md).
- F2 starts a new game.

### 1.6 Languages

- Russian and English UI texts (menu, dialog, window title).
- Default: Russian if the browser language starts with `ru`, otherwise English.
- Switchable from the Game menu; the switch applies immediately without restarting the game.

### 1.7 Persistence (localStorage)

- Saved: current level (including custom width/height/mines), Marks (?) on/off, language.
- Not saved: the game in progress, best times.
- If localStorage is unavailable or contains invalid data, defaults are used and the game still works.

### 1.8 Touch devices

- Tap on a closed cell = open.
- Long press on a closed cell = cycle flag / “?” (same as right click).
- Tap on an opened number = chord.
- The browser context menu and text selection must not appear on the field.

## 2. Technical requirements

### 2.1 Stack

- HTML5, SCSS compiled by the **`sass` CLI** (no bundler), vanilla **JavaScript ES modules** loaded natively
  by the browser.
- **npm** as package manager. **Node.js 24 LTS installed inside WSL via fnm**; version pinned in `.nvmrc`
  (fnm reads it). The Windows Node.js must never be used. How to load fnm in agent shells: see CLAUDE.md.
- Local dev: `npm run dev` runs `sass --watch` and a static server with live reload in parallel.
- No runtime dependencies and no frameworks.

### 2.2 Code structure

```
.github/workflows/     pages.yml: checks, CSS build and deploy to GitHub Pages
index.html
assets/                SVG graphics (own artwork in XP style)
css/                   compiled CSS (generated, git-ignored)
src/
  js/
    main.js            entry point: wires services, core and UI
    core/              pure game logic — no DOM, no timers, no Math.random
    ui/                rendering and input handling (mouse, touch, keyboard, menu, dialog)
    services/          settings storage, i18n
    i18n/              ru.js, en.js dictionaries
  scss/                7-1 pattern
    abstracts/  base/  components/  layout/  pages/  themes/  vendors/
    main.scss
tests/                 mirrors src/js (core/, ui/, services/)
```

Rules:

- `core` never imports from `ui` or touches the DOM. Randomness (`random()`) and time (`now()` / tick
  scheduler) are injected so tests are deterministic.
- `core` exposes commands (`open`, `toggleMark`, `chord`, `newGame`, …) and emits events / a state snapshot;
  `ui` subscribes and re-renders.
- One module = one responsibility. Prefer pure functions; avoid global mutable state.
- Public functions documented with short JSDoc.

### 2.3 Styles and graphics

- SCSS 7-1: variables (colours, sizes) in `abstracts/`, each UI part (window, menu, panel, LED, smiley, cell,
  dialog) is its own partial in `components/`.
- Cells and window bevels drawn with CSS; icons (mine, flag, “?”, crossed mine, smileys, LED digits, window
  buttons) are separate `.svg` files in `assets/`, applied as CSS `background-image` via state classes.
- Number colours: 1 blue, 2 green, 3 red, 4 navy, 5 maroon, 6 teal, 7 black, 8 grey.
- Original Microsoft graphics must not be copied.

### 2.4 Testing (TDD)

- **Vitest**; UI tests in the **jsdom** environment.
- Tests are written before the code for every task.
- Core logic: every rule in section 1.2 has tests (including edge cases: corners, flood fill borders, chord with
  wrong flags, negative counter, timer cap at 999).
- UI: rendering of each cell state, mouse/touch sequences, menu actions, dialog validation, i18n switch,
  settings load/save with broken storage.
- Coverage is measured (`@vitest/coverage-v8`); thresholds — see DECISIONS.md.

### 2.5 Code quality

- **ESLint** (flat config, recommended rules) and **Prettier**; `eslint-config-prettier` to avoid conflicts.
- `npm test`, `npm run lint`, `npm run format:check` must pass before a stage is marked done.

### 2.6 Version control

- Git repository on GitHub (`origin`). Agents commit locally and never push unless asked; the owner pushes.
- GitHub Actions (`.github/workflows/pages.yml`): on every push to `master` it runs lint, the format check and
  the tests, compiles the CSS and deploys `index.html`, `css/`, `src/js/` and `assets/` to GitHub Pages. A failing
  check blocks the deploy.
