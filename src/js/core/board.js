/**
 * @typedef {{mine: boolean, adjacent: number}} Cell
 * @typedef {{width: number, height: number, cells: Cell[]}} Board
 * Cells are stored row by row: index = y * width + x.
 */

/**
 * Indices of the cells around `index` (up to 8; fewer on edges and corners).
 * @param {number} width
 * @param {number} height
 * @param {number} index
 * @returns {number[]}
 */
export function getNeighbors(width, height, index) {
  const x = index % width;
  const y = Math.floor(index / width);
  const neighbors = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      const isSelf = dx === 0 && dy === 0;
      if (!isSelf && nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push(ny * width + nx);
      }
    }
  }
  return neighbors;
}

/** Picks `count` distinct indices from 0..total-1; each pick takes one of the still free cells. */
function pickMineIndices(total, count, random) {
  const free = Array.from({ length: total }, (_, i) => i);
  const picked = [];
  for (let i = 0; i < count; i++) {
    const [index] = free.splice(Math.floor(random() * free.length), 1);
    picked.push(index);
  }
  return picked;
}

/**
 * Creates a board with randomly placed mines and adjacent-mine counts.
 * @param {{width: number, height: number, mines: number, random: () => number}} options
 *   `random` returns a number in [0, 1), like Math.random.
 * @returns {Board}
 * @throws {RangeError} if the size is not positive or mines is not within 0..width*height
 */
export function createBoard({ width, height, mines, random }) {
  if (width < 1 || height < 1) {
    throw new RangeError("Board size must be positive");
  }
  if (mines < 0 || mines > width * height) {
    throw new RangeError(
      "Mine count must be between 0 and the number of cells",
    );
  }

  const cells = Array.from({ length: width * height }, () => ({
    mine: false,
    adjacent: 0,
  }));
  for (const index of pickMineIndices(cells.length, mines, random)) {
    cells[index].mine = true;
  }
  cells.forEach((cell, index) => {
    cell.adjacent = getNeighbors(width, height, index).filter(
      (n) => cells[n].mine,
    ).length;
  });

  return { width, height, cells };
}
