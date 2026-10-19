import { describe, expect, it } from "vitest";
import { createBoard, getNeighbors } from "../../src/js/core/board.js";

/** Deterministic random() cycling through the given values. */
function sequence(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Small seeded PRNG (mulberry32) for property-style checks. */
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mineIndices(board) {
  return board.cells.flatMap((cell, i) => (cell.mine ? [i] : []));
}

describe("getNeighbors", () => {
  it("returns 8 neighbours for an inner cell", () => {
    expect(getNeighbors(5, 5, 6).sort((a, b) => a - b)).toEqual([
      0, 1, 2, 5, 7, 10, 11, 12,
    ]);
  });

  it("returns 3 neighbours for a corner", () => {
    expect(getNeighbors(3, 3, 0).sort((a, b) => a - b)).toEqual([1, 3, 4]);
    expect(getNeighbors(3, 3, 2).sort((a, b) => a - b)).toEqual([1, 4, 5]);
    expect(getNeighbors(3, 3, 6).sort((a, b) => a - b)).toEqual([3, 4, 7]);
    expect(getNeighbors(3, 3, 8).sort((a, b) => a - b)).toEqual([4, 5, 7]);
  });

  it("returns 5 neighbours for an edge cell", () => {
    expect(getNeighbors(3, 3, 1).sort((a, b) => a - b)).toEqual([
      0, 2, 3, 4, 5,
    ]);
    expect(getNeighbors(3, 3, 3).sort((a, b) => a - b)).toEqual([
      0, 1, 4, 6, 7,
    ]);
    expect(getNeighbors(3, 3, 5).sort((a, b) => a - b)).toEqual([
      1, 2, 4, 7, 8,
    ]);
    expect(getNeighbors(3, 3, 7).sort((a, b) => a - b)).toEqual([
      3, 4, 5, 6, 8,
    ]);
  });

  it("does not wrap around the left and right borders", () => {
    // index 4 is the last cell of row 0 in a 5-wide board; index 5 starts row 1
    expect(getNeighbors(5, 3, 4)).not.toContain(5);
    expect(getNeighbors(5, 3, 5)).not.toContain(4);
  });

  it("handles a single-column board", () => {
    expect(getNeighbors(1, 3, 1).sort((a, b) => a - b)).toEqual([0, 2]);
  });
});

describe("createBoard", () => {
  it("creates width * height cells", () => {
    const board = createBoard({
      width: 9,
      height: 9,
      mines: 10,
      random: seeded(1),
    });
    expect(board.width).toBe(9);
    expect(board.height).toBe(9);
    expect(board.cells).toHaveLength(81);
  });

  it("places exactly the requested number of mines", () => {
    for (const [width, height, mines] of [
      [9, 9, 10],
      [16, 16, 40],
      [30, 16, 99],
    ]) {
      const board = createBoard({
        width,
        height,
        mines,
        random: seeded(width * height),
      });
      expect(mineIndices(board)).toHaveLength(mines);
    }
  });

  it("never places two mines in one cell, even for the maximum custom density", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const board = createBoard({
        width: 30,
        height: 24,
        mines: 29 * 23,
        random: seeded(seed),
      });
      expect(new Set(mineIndices(board)).size).toBe(29 * 23);
    }
  });

  it("is deterministic for the same random sequence", () => {
    const a = createBoard({
      width: 16,
      height: 16,
      mines: 40,
      random: seeded(42),
    });
    const b = createBoard({
      width: 16,
      height: 16,
      mines: 40,
      random: seeded(42),
    });
    expect(a).toEqual(b);
  });

  it("produces different layouts for different random sequences", () => {
    const a = createBoard({
      width: 16,
      height: 16,
      mines: 40,
      random: seeded(1),
    });
    const b = createBoard({
      width: 16,
      height: 16,
      mines: 40,
      random: seeded(2),
    });
    expect(mineIndices(a)).not.toEqual(mineIndices(b));
  });

  it("uses random() to choose positions (random() = 0 picks the first free cells)", () => {
    const board = createBoard({
      width: 4,
      height: 4,
      mines: 3,
      random: () => 0,
    });
    expect(mineIndices(board)).toEqual([0, 1, 2]);
  });

  it("can reach the last cell when random() is just below 1", () => {
    const board = createBoard({
      width: 4,
      height: 4,
      mines: 1,
      random: () => 0.999999,
    });
    expect(mineIndices(board)).toEqual([15]);
  });

  it("covers every cell over many seeds (no unreachable positions)", () => {
    const hit = new Set();
    for (let seed = 1; seed <= 200; seed++) {
      mineIndices(
        createBoard({ width: 9, height: 9, mines: 10, random: seeded(seed) }),
      ).forEach((i) => hit.add(i));
    }
    expect(hit.size).toBe(81);
  });

  it("accepts a fixed layout through a scripted random sequence", () => {
    // 3x3 board, free cells shrink after every pick: 9 -> 8 -> ...
    // 0.5 * 9 = 4 -> cell 4; then free = [0,1,2,3,5,6,7,8]; 0 -> cell 0
    const board = createBoard({
      width: 3,
      height: 3,
      mines: 2,
      random: sequence([0.5, 0]),
    });
    expect(mineIndices(board)).toEqual([0, 4]);
  });

  it("calculates adjacent mine counts", () => {
    // Mines at 0 and 4 on a 3x3 board:
    //   * 2 1
    //   2 * 1
    //   1 1 1
    const board = createBoard({
      width: 3,
      height: 3,
      mines: 2,
      random: sequence([0.5, 0]),
    });
    expect(board.cells.map((c) => c.adjacent)).toEqual([
      1, 2, 1, 2, 1, 1, 1, 1, 1,
    ]);
  });

  it("counts mines in corners and edges correctly", () => {
    // Mines at 0, 1, 2 (top row of a 4x4 board)
    const board = createBoard({
      width: 4,
      height: 4,
      mines: 3,
      random: () => 0,
    });
    const adjacent = board.cells.map((c) => c.adjacent);
    expect(adjacent.slice(4, 8)).toEqual([2, 3, 2, 1]);
    expect(adjacent.slice(8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("sets adjacent for every cell to the number of mine neighbours", () => {
    const board = createBoard({
      width: 30,
      height: 16,
      mines: 99,
      random: seeded(7),
    });
    board.cells.forEach((cell, i) => {
      const expected = getNeighbors(board.width, board.height, i).filter(
        (n) => board.cells[n].mine,
      ).length;
      expect(cell.adjacent).toBe(expected);
    });
  });

  it("rejects a board with more mines than cells", () => {
    expect(() =>
      createBoard({ width: 3, height: 3, mines: 10, random: () => 0 }),
    ).toThrow(RangeError);
  });

  it("rejects non-positive sizes and negative mine counts", () => {
    expect(() =>
      createBoard({ width: 0, height: 3, mines: 1, random: () => 0 }),
    ).toThrow(RangeError);
    expect(() =>
      createBoard({ width: 3, height: 0, mines: 1, random: () => 0 }),
    ).toThrow(RangeError);
    expect(() =>
      createBoard({ width: 3, height: 3, mines: -1, random: () => 0 }),
    ).toThrow(RangeError);
  });
});
