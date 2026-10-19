/** Preset levels, as in Windows XP Minesweeper. */
export const LEVELS = Object.freeze({
  beginner: Object.freeze({ width: 9, height: 9, mines: 10 }),
  intermediate: Object.freeze({ width: 16, height: 16, mines: 40 }),
  expert: Object.freeze({ width: 30, height: 16, mines: 99 }),
});

const MIN_SIZE = 9;
const MAX_WIDTH = 30;
const MAX_HEIGHT = 24;
const MIN_MINES = 10;

/** Converts user input to an integer; anything that is not a finite number becomes `fallback`. */
function toInteger(value, fallback) {
  const number = Math.trunc(Number(value));
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Clamps a custom field to the XP limits: width 9–30, height 9–24,
 * mines 10 to (height − 1) × (width − 1). Mines are limited after the size is clamped.
 * @param {{width: number|string, height: number|string, mines: number|string}} custom
 * @returns {{width: number, height: number, mines: number}}
 */
export function clampCustom({ width, height, mines }) {
  const clampedWidth = clamp(toInteger(width, MIN_SIZE), MIN_SIZE, MAX_WIDTH);
  const clampedHeight = clamp(
    toInteger(height, MIN_SIZE),
    MIN_SIZE,
    MAX_HEIGHT,
  );
  const maxMines = (clampedWidth - 1) * (clampedHeight - 1);
  return {
    width: clampedWidth,
    height: clampedHeight,
    mines: clamp(toInteger(mines, MIN_MINES), MIN_MINES, maxMines),
  };
}
