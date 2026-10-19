# CLAUDE.md

Browser clone of **Minesweeper from Windows XP** (look and behaviour), written in plain HTML + SCSS + JavaScript.
The owner uses this project to play and to learn agentic programming.

## Read first

- [docs/PROJECT.md](docs/PROJECT.md) — what we build and why, scope
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional and technical requirements
- [docs/PLAN.md](docs/PLAN.md) — stages, tasks, acceptance criteria, progress
- [docs/DECISIONS.md](docs/DECISIONS.md) — decision log and open questions

## Golden rule: the owner makes the decisions

- Never make a product, design or technical decision on your own. If something is not covered by the docs,
  **stop and ask** (one question at a time, with options and a recommendation).
- Do not add dependencies, change the folder structure, or deviate from the docs without approval.
- Record every new decision in [docs/DECISIONS.md](docs/DECISIONS.md). Items marked **Proposed** there are not
  yet approved: confirm them with the owner before relying on them.

## Workflow

- Work through [docs/PLAN.md](docs/PLAN.md) in order. Several stages may be done in a row; stop as soon as an
  unresolved question or a failing check appears.
- **TDD**: write a failing test first, then the code, then refactor. No production code without a test.
- A stage is done only when `npm test`, `npm run lint` and `npm run format:check` all pass.
  Tick the boxes in PLAN.md when a task is done.
- Git is local only. Do not commit unless the owner asks.
- Everything in English: code, comments, docs, commit messages. (UI texts exist in RU and EN.)

## Commands (available after Stage 0)

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | `sass --watch` + local static server with live reload  |
| `npm run build:css`    | Compile SCSS to `css/main.css` once                    |
| `npm test`             | Run Vitest once                                        |
| `npm run test:watch`   | Vitest in watch mode                                   |
| `npm run coverage`     | Tests with coverage report                             |
| `npm run lint`         | ESLint                                                 |
| `npm run format`       | Prettier write (`format:check` to only check)          |

## Environment: Node.js (WSL only)

- The project lives in WSL (Ubuntu). Node.js **24 LTS** is installed inside WSL with **fnm**
  (`~/.local/share/fnm`), npm 11.
- **Never use or install the Windows Node.js** (`C:\Program Files\nodejs`, `/mnt/c/...`, `node.exe`, `npm.cmd`),
  and never install Node another way (apt, nvm, Windows installer). If Node is missing, stop and tell the owner.
- fnm is activated only in interactive shells (`~/.bashrc`). In a non-interactive shell (the agent's Bash tool),
  load it first in the same command:

  ```bash
  eval "$("$HOME/.local/share/fnm/fnm" env --shell bash)" && npm test
  ```

- Sanity check: `which node` must point inside WSL (`/run/user/.../fnm_multishells/...`), never to `/mnt/c/`.

## Architecture in one paragraph

`src/js/core/` is pure game logic: no DOM, no timers, no `Math.random` directly (randomness and clock are
injected), fully unit-tested. `src/js/ui/` renders state to the DOM and translates mouse/touch/keyboard input
into core commands. They talk through an event subscription (core emits, UI listens). `src/js/services/` holds
settings storage (localStorage) and i18n. SCSS follows the 7-1 pattern in `src/scss/`. Graphics are our own SVG
files in `assets/` used as CSS backgrounds — never copy original Microsoft sprites.
