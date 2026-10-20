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
| 16 | Git                  | ~~Local repository only~~ — superseded by decision 41                    |
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
| 28 | Commits              | Agent commits on its own: one commit per stage and one per plan task (2026-10-19) |
| 29 | Desktop background   | Resolves Q7. Switchable, two options for now: solid XP desktop colour and a Bliss-like gradient (own artwork). Chosen in a “Background” submenu of the Game menu; saved in localStorage with the other settings (2026-10-19) |
| 30 | Cell size            | 16 × 16 px as in XP; the whole window is scaled through one CSS variable (×1 by default, ×2 on high-DPI); no scale choice in the menu (was P6) |
| 31 | Default background   | Solid XP colour until the player chooses another (was P7)                |
| 32 | Marks turned off    | Existing “?” marks disappear (become closed); flags stay (2026-10-19)    |
| 33 | Supported browsers   | Resolves Q5. Wide support: browser versions released in the last two years (Chrome, Edge, Firefox, Safari); older ones are not checked (2026-10-19) |
| 34 | Keyboard             | Resolves Q6. F2 = new game. Playing from the keyboard: arrow keys move a cursor over the field, Space opens a closed cell or does a chord on an opened number, F cycles flag / “?”. No ARIA roles or screen-reader work in v1 (2026-10-19) |
| 35 | Help menu            | Resolves Q2. Two items: “About” (small XP-style window: name, version, “learning clone of Windows XP Minesweeper”) and “Rules” (short RU/EN text on the rules and the controls: mouse, keyboard, touch) (2026-10-19) |
| 36 | Exit item            | Resolves Q3. No “Exit” item in the Game menu: a page cannot close its own tab (2026-10-19) |
| 37 | Narrow screens      | Resolves Q4. The whole window is scaled down to fit the screen width (never up), through the same `--u` unit as decision 30: `--u = base unit × --fit`; `--fit` is set by JS at start, on a new game and on resize. No horizontal scroll (2026-10-19) |
| 38 | Long press          | Agreed P5: 400 ms, one constant (`LONG_PRESS_MS` in `src/js/ui/touch.js`). The mark is placed as soon as the time is up. Touch and pen pointers use `touch.js`; sliding to another cell cancels the gesture (2026-10-19) |
| 39 | Hover states        | Window buttons (minimize, maximize, close) get Luna-like hot (lighter, on hover) and pressed (darker) looks; a menu bar item is highlighted on hover like an open one (2026-10-20) |
| 40 | Commit metadata     | The owner's name and email in the git author/committer fields are fine; decision 24 is about file contents, not git metadata (2026-10-20) |
| 41 | Hosting             | Supersedes 16. The repository is on GitHub (`origin`); the owner makes it public and the game is published on GitHub Pages. The owner pushes; agents commit locally and never push unless asked (a push to `master` deploys the site) (2026-10-20) |
| 42 | Deploy              | GitHub Actions workflow `.github/workflows/pages.yml`, on every push to `master` and by hand: `npm ci`, lint, format check, tests, `build:css`; only if all pass, `index.html`, `css/`, `src/js/` and `assets/` are deployed to Pages. Compiled CSS stays out of git (2026-10-20) |
| 43 | Unofficial notice   | Resolves Q8. “Unofficial project, not affiliated with Microsoft. Windows is a trademark of Microsoft Corporation.” in the About dialog (RU/EN, key `about.notice`) and in `README.md` (2026-10-20) |
| 44 | Site link in README | `README.md` links to the GitHub Pages site. The link contains the owner's GitHub username: an approved exception to decision 24, allowed only there (2026-10-20) |
| 45 | License             | Resolves Q9. MIT, in `LICENSE`. Its copyright line has the owner's real name: an approved exception to decision 24, allowed only there (2026-10-20) |

## Proposed (need confirmation)

| #  | Topic                   | Proposal                                                                              |
| -- | ----------------------- | ------------------------------------------------------------------------------------- |
| P1 | ~~Node.js in WSL~~      | ~~Install via nvm, Node 22 LTS~~ — superseded by decision 23                          |
| P7 | ~~Default background~~  | ~~Solid XP colour~~ — agreed as decision 31                                           |
| P5 | ~~Long-press duration~~ | ~~400 ms~~ — agreed as decision 38                                                    |
| P6 | ~~Cell size~~          | ~~16 × 16 px as in XP, whole window scaled ×2 on high-DPI / via CSS variable~~ — agreed as decision 30 |

## Open questions (to be answered before the related stage)

| #  | Stage | Question                                                                                 |
| -- | ----- | ---------------------------------------------------------------------------------------- |
| Q1 | 0     | ~~Node.js not installed in WSL~~ — resolved by decision 23                               |
| Q2 | 8     | ~~Help menu contents~~ — resolved by decision 35 |
| Q3 | 8     | ~~Exit item~~ — resolved by decision 36 |
| Q4 | 9     | ~~Expert field on a phone~~ — resolved by decision 37 |
| Q5 | 6     | ~~Supported browsers~~ — resolved by decision 33 |
| Q6 | 7     | ~~Keyboard / accessibility~~ — resolved by decision 34 |
| Q7 | 5     | ~~Desktop background~~ — resolved by decision 29                                         |
| Q8 | 11    | ~~Notice about Microsoft: where~~ — resolved by decision 43                              |
| Q9 | 11    | ~~License~~ — resolved by decision 45                                                    |
