# Project overview

## What

A web version of Minesweeper that reproduces the **Windows XP** game as closely as practical: the Luna
window frame, the menu bar, the LED mine counter and timer, the smiley button, the 3D cells, and the same
rules and mouse behaviour.

## Why

1. To have a faithful, playable XP Minesweeper in the browser.
2. To learn agentic programming: the project is built by an AI agent working from these documents, with the
   owner making every decision and reviewing the result.

## Principles

- **Readable and maintainable code** over clever code. Small modules, clear names, no frameworks.
- **Covered by tests**, written test-first (TDD).
- **Faithful to XP** unless a deviation is explicitly decided (see [DECISIONS.md](DECISIONS.md)).
- **No decisions without the owner.**

## Scope (v1)

In scope:

- Levels: Beginner, Intermediate, Expert, Custom.
- Open cells, flood fill of empty areas, flags, question marks (toggleable “Marks (?)”), chording.
- Mine counter, timer, smiley (new game, reactions).
- Game menu, Custom field dialog, F2 for new game.
- UI in Russian and English, switchable from the menu; default from the browser language.
- Remember level (including the custom size), Marks setting and language between visits.
- Touch support: long press = flag, tap on an opened number = chord.

Out of scope for v1 (explicitly declined):

- Best Times (high scores), Sound, Color/monochrome toggle.
- First-click protection (the first click may hit a mine).
- Working window buttons or dragging the window (they are decorative).
- Saving an unfinished game.
- Online features, hosting/deployment, CI.

## Tech stack (summary)

HTML · SCSS (7-1 pattern, compiled with the `sass` CLI) · vanilla JavaScript (ES modules) · Vitest (+ jsdom) ·
ESLint · Prettier · npm · local git. Details in [REQUIREMENTS.md](REQUIREMENTS.md).
