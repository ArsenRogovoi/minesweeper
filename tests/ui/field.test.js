import { beforeEach, describe, expect, it } from "vitest";
import { createFieldRenderer } from "../../src/js/ui/field.js";
import { gameWithMines } from "../core/helpers.js";

// 4x4 board with one mine in the top-left corner:
//   *  1  0  0
//   1  1  0  0
//   0  0  0  0
//   0  0  0  0
const CORNER_MINE = { width: 4, height: 4, mineIndices: [0] };

let container;
let renderer;

beforeEach(() => {
  document.body.innerHTML = '<div class="field" id="field"></div>';
  container = document.getElementById("field");
  renderer = createFieldRenderer(container);
});

const cells = () => [...container.querySelectorAll(".cell")];
const classesOf = (index) => [...cells()[index].classList].sort();

describe("field renderer: structure", () => {
  it("creates width * height cells with their index", () => {
    renderer.render(gameWithMines(CORNER_MINE).getSnapshot());
    expect(cells()).toHaveLength(16);
    expect(cells().map((c) => c.dataset.index)).toEqual(
      [...Array(16).keys()].map(String),
    );
  });

  it("sets the number of columns for the grid", () => {
    renderer.render(gameWithMines(CORNER_MINE).getSnapshot());
    expect(container.style.getPropertyValue("--columns")).toBe("4");
  });

  it("keeps the same elements when rendering again with the same size", () => {
    const game = gameWithMines(CORNER_MINE);
    renderer.render(game.getSnapshot());
    const before = cells();
    game.toggleMark(3);
    renderer.render(game.getSnapshot());
    expect(cells()).toEqual(before);
    cells().forEach((cell, i) => expect(cell).toBe(before[i]));
  });

  it("rebuilds the cells when the field size changes", () => {
    const game = gameWithMines(CORNER_MINE);
    renderer.render(game.getSnapshot());
    game.newGame({ width: 9, height: 9, mines: 10 });
    renderer.render(game.getSnapshot());
    expect(cells()).toHaveLength(81);
    expect(container.style.getPropertyValue("--columns")).toBe("9");
  });

  it("rebuilds the cells when only the shape changes (same cell count)", () => {
    const game = gameWithMines({ width: 10, height: 12, mineIndices: [0] });
    renderer.render(game.getSnapshot());
    game.newGame({ width: 12, height: 10, mines: 1 });
    renderer.render(game.getSnapshot());
    expect(cells()).toHaveLength(120);
    expect(container.style.getPropertyValue("--columns")).toBe("12");
  });
});

describe("field renderer: cell states", () => {
  it("shows closed cells as raised", () => {
    renderer.render(gameWithMines(CORNER_MINE).getSnapshot());
    expect(classesOf(3)).toEqual(["cell", "cell--closed"]);
    expect(cells()[3].textContent).toBe("");
  });

  it("shows a flag on a closed cell", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(3);
    renderer.render(game.getSnapshot());
    expect(classesOf(3)).toEqual(["cell", "cell--closed", "cell--flag"]);
  });

  it("shows a question mark on a closed cell", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(3);
    game.toggleMark(3);
    renderer.render(game.getSnapshot());
    expect(classesOf(3)).toEqual(["cell", "cell--closed", "cell--question"]);
  });

  it("shows an opened number with its count and colour class", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    renderer.render(game.getSnapshot());
    expect(classesOf(5)).toEqual(["cell", "cell--n1", "cell--open"]);
    expect(cells()[5].textContent).toBe("1");
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])("uses the colour class cell--n%i", (n) => {
    // a mine on every neighbour of the centre cell gives the number n
    const neighbours = [0, 1, 2, 3, 5, 6, 7, 8].slice(0, n);
    const game = gameWithMines({
      width: 3,
      height: 3,
      mineIndices: neighbours,
    });
    game.open(4);
    renderer.render(game.getSnapshot());
    expect(classesOf(4)).toEqual(["cell", `cell--n${n}`, "cell--open"]);
    expect(cells()[4].textContent).toBe(String(n));
  });

  it("shows an opened empty cell flat and without text", () => {
    const game = gameWithMines({
      width: 5,
      height: 3,
      mineIndices: [2, 7, 12],
    });
    game.open(0);
    renderer.render(game.getSnapshot());
    expect(classesOf(0)).toEqual(["cell", "cell--open"]);
    expect(cells()[0].textContent).toBe("");
  });

  it("shows the exploded mine on red and the other mines after a loss", () => {
    const game = gameWithMines({
      width: 4,
      height: 4,
      mineIndices: [0, 5, 10],
    });
    game.open(15);
    game.open(5);
    renderer.render(game.getSnapshot());
    expect(classesOf(5)).toEqual([
      "cell",
      "cell--exploded",
      "cell--mine",
      "cell--open",
    ]);
    expect(classesOf(0)).toEqual(["cell", "cell--mine", "cell--open"]);
  });

  it("shows a wrong flag as a crossed-out mine after a loss", () => {
    const game = gameWithMines({
      width: 4,
      height: 4,
      mineIndices: [0, 5, 10],
    });
    game.open(15);
    game.toggleMark(1);
    game.open(5);
    renderer.render(game.getSnapshot());
    expect(classesOf(1)).toEqual(["cell", "cell--open", "cell--wrong-flag"]);
  });

  it("keeps a correct flag as a flag after a loss", () => {
    const game = gameWithMines({
      width: 4,
      height: 4,
      mineIndices: [0, 5, 10],
    });
    game.open(15);
    game.toggleMark(0);
    game.open(5);
    renderer.render(game.getSnapshot());
    expect(classesOf(0)).toEqual(["cell", "cell--closed", "cell--flag"]);
  });

  it("clears old classes and text when a cell changes state", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    renderer.render(game.getSnapshot());
    game.newGame();
    renderer.render(game.getSnapshot());
    expect(classesOf(5)).toEqual(["cell", "cell--closed"]);
    expect(cells()[5].textContent).toBe("");
  });
});

describe("field renderer: pressed cells", () => {
  it("marks the given cells as pressed and clears the others", () => {
    renderer.render(gameWithMines(CORNER_MINE).getSnapshot());
    renderer.setPressed([3, 4]);
    expect(classesOf(3)).toEqual(["cell", "cell--closed", "cell--pressed"]);
    expect(classesOf(4)).toEqual(["cell", "cell--closed", "cell--pressed"]);
    renderer.setPressed([4]);
    expect(classesOf(3)).toEqual(["cell", "cell--closed"]);
    expect(classesOf(4)).toEqual(["cell", "cell--closed", "cell--pressed"]);
    renderer.setPressed([]);
    expect(classesOf(4)).toEqual(["cell", "cell--closed"]);
  });

  it("keeps cells pressed when the field is rendered again", () => {
    const game = gameWithMines(CORNER_MINE);
    renderer.render(game.getSnapshot());
    renderer.setPressed([3]);
    game.toggleMark(7);
    renderer.render(game.getSnapshot());
    expect(classesOf(3)).toEqual(["cell", "cell--closed", "cell--pressed"]);
  });

  it("forgets pressed cells when the field is rebuilt", () => {
    const game = gameWithMines(CORNER_MINE);
    renderer.render(game.getSnapshot());
    renderer.setPressed([3]);
    game.newGame({ width: 9, height: 9, mines: 10 });
    renderer.render(game.getSnapshot());
    expect(container.querySelectorAll(".cell--pressed")).toHaveLength(0);
  });
});
