# Minesweeper — Windows XP style

A browser clone of Minesweeper from Windows XP: the Luna window, the menu bar, the LED mine counter and timer,
the smiley button and the same rules. Plain HTML, SCSS and JavaScript (ES modules), with no frameworks and no
runtime dependencies. All graphics are original SVG drawings.

The project is also an exercise in agentic programming: the code is written by an AI agent working from the
documents in [docs/](docs/), and the owner makes every decision.

## Play

Play online: see the website link in the About section of this repository on GitHub. Or run the game locally
(see [Run locally](#run-locally)).

Levels: Beginner (9 × 9, 10 mines), Intermediate (16 × 16, 40 mines), Expert (30 × 16, 99 mines) and Custom
(up to 30 × 24). The Game menu also has Marks (?), Background and Language (Русский / English); the settings
are remembered in the browser.

| Action                       | Mouse                             | Keyboard          | Touch           |
| ---------------------------- | --------------------------------- | ----------------- | --------------- |
| Open a cell                  | Left click                        | Space             | Tap             |
| Flag → “?” → closed          | Right click                       | F                 | Long press      |
| Chord: open around a number¹ | Both buttons or the middle button | Space on a number | Tap on a number |
| Move the cursor              | —                                 | Arrow keys        | —               |
| New game                     | Click the smiley                  | F2                | Tap the smiley  |

¹ Works when the number of flags around the number matches it.

Unlike the original, the first click is not protected: it can hit a mine.

## Run locally

You need Node.js 24 (the version is pinned in [.nvmrc](.nvmrc)) and npm.

```bash
npm ci
npm run dev
```

Then open <http://localhost:3000>. `npm run dev` recompiles the SCSS on every change and reloads the page.

## Test and check

| Command                | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `npm test`             | Run the tests (Vitest + jsdom) once                        |
| `npm run test:watch`   | Tests in watch mode                                        |
| `npm run coverage`     | Tests with a coverage report                               |
| `npm run lint`         | ESLint                                                     |
| `npm run format:check` | Check formatting with Prettier (`npm run format` fixes it) |
| `npm run build:css`    | Compile the SCSS to `css/main.css` once                    |

## Project structure

```
index.html
assets/          SVG graphics (original drawings in XP style)
src/js/core/     game logic: no DOM, no timers, fully unit-tested
src/js/ui/       rendering and input (mouse, touch, keyboard, menu, dialogs)
src/js/services/ settings storage and i18n
src/js/i18n/     Russian and English texts
src/scss/        styles (7-1 pattern)
tests/           tests, mirroring src/js/
```

More detail: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Deployment

Every push to `master` runs [.github/workflows/pages.yml](.github/workflows/pages.yml): lint, the format check
and the tests, then the CSS build and the deploy to GitHub Pages. If a check fails, the site is not updated.

## Documentation

- [docs/PROJECT.md](docs/PROJECT.md) — what we build and why, scope
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional and technical requirements
- [docs/PLAN.md](docs/PLAN.md) — stages, tasks and progress
- [docs/DECISIONS.md](docs/DECISIONS.md) — decision log
- [CLAUDE.md](CLAUDE.md) — instructions for the AI agent

## Notice

This is an unofficial project, not affiliated with Microsoft. Windows is a trademark of Microsoft Corporation.
No Microsoft artwork is used: all graphics are original drawings.
