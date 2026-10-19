# Decisions

**Agreed** = decided by the owner. **Proposed** = suggested by the agent, needs the owner's confirmation before it
is relied on. Add new rows instead of editing history; if a decision changes, mark the old one as superseded.

## Agreed (2026-10-19)

| #  | Topic                | Decision                                                                 |
| -- | -------------------- | ------------------------------------------------------------------------ |
| 1  | Platform             | Browser game: HTML, SCSS (7-1 pattern), JavaScript                       |
| 2  | Goals                | Play + learn agentic programming; readable, maintainable, tested code    |
| 3  | Look & behaviour     | Reproduce Windows XP Minesweeper                                         |
| 4  | Docs layout          | `CLAUDE.md` + `docs/` (project, requirements, plan, decisions)           |
| 5  | Build                | `sass` CLI only, no bundler; native ES modules                           |
| 6  | Tests                | Vitest only (no browser e2e)                                             |
| 7  | Code quality         | ESLint + Prettier (no Stylelint, no JSDoc type-checking)                 |
| 8  | Window               | Luna window frame + menu bar; window buttons decorative; not draggable   |
| 9  | Graphics             | Own SVG files in `assets/` + CSS backgrounds                             |
| 10 | Features             | Levels + Custom, chord (both buttons), Marks (?)                         |
| 11 | Not included         | Best Times, Sound, Color toggle                                          |
| 12 | Language             | RU + EN; default from browser language; switch in the Game menu          |
| 13 | First click          | No protection (may hit a mine) — deliberate deviation from XP            |
| 14 | Touch                | Supported: long press = flag/“?”, tap on a number = chord                |
| 15 | Persistence          | localStorage: level (incl. custom size), Marks, language                 |
| 16 | Git                  | Local repository only                                                    |
| 17 | Architecture         | Pure `core` + `ui` layer, connected by events                            |
| 18 | Docs/code language   | Everything in English                                                    |
| 19 | Method               | TDD                                                                      |
| 20 | Agent workflow       | Several plan stages in a row; stop on any unresolved question            |
| 21 | Dev server           | npm script: `sass --watch` + static server, in parallel                  |
| 22 | Package manager      | npm                                                                      |
| 23 | Node.js              | Node 24 LTS inside WSL via fnm (installed by the owner); Windows Node.js is never used (supersedes P1) |
| 24 | Sensitive data       | No secrets or personal data in any file; `.env*` git-ignored; agents warn the owner on any finding |
| 25 | Dev tooling          | `browser-sync` (static server + live reload) and `npm-run-all2` (parallel scripts) (was P2) |
| 26 | Test location        | Separate `tests/` folder mirroring `src/js/` (was P3)                    |
| 27 | Coverage thresholds  | `core/` 100 % lines and branches; whole project ≥ 90 % (was P4)         |

## Proposed (need confirmation)

| #  | Topic                   | Proposal                                                                              |
| -- | ----------------------- | ------------------------------------------------------------------------------------- |
| P1 | ~~Node.js in WSL~~      | ~~Install via nvm, Node 22 LTS~~ — superseded by decision 23                          |
| P5 | Long-press duration     | 400 ms, defined as a single constant                                                  |
| P6 | Cell size               | 16 × 16 px as in XP, whole window scaled ×2 on high-DPI / via CSS variable            |

## Open questions (to be answered before the related stage)

| #  | Stage | Question                                                                                 |
| -- | ----- | ---------------------------------------------------------------------------------------- |
| Q1 | 0     | ~~Node.js not installed in WSL~~ — resolved by decision 23                               |
| Q2 | 8     | Help menu: what should it contain? (e.g. “About” dialog only / rules page / disabled items as decoration) |
| Q3 | 8     | Should the XP “Exit” item exist in the Game menu, and what would it do?                  |
| Q4 | 9     | Expert field (30 columns) is wider than a phone screen: scale the window down, or scroll horizontally? |
| Q5 | 6     | Supported browsers (proposal: latest Chrome, Edge, Firefox, Safari)?                     |
| Q6 | 7     | Keyboard / accessibility support beyond F2 — needed in v1?                               |
| Q7 | 5     | Desktop background around the window: XP “Bliss”-like colour, plain colour, or nothing?  |
