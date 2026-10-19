import { beforeEach, describe, expect, it } from "vitest";
import { createFieldRenderer } from "../../src/js/ui/field.js";
import { createKeyboardInput } from "../../src/js/ui/keyboard.js";
import { gameWithMines } from "../core/helpers.js";

// 5x3 board, the mines (2, 7, 12) form a wall in the middle column:
//   0 1 * . .      indices   0  1  2  3  4
//   0 3 * . .                5  6  7  8  9
//   0 1 * . .               10 11 12 13 14
const WALL = { width: 5, height: 3, mineIndices: [2, 7, 12] };

let game;
let field;
let cursors;
let input;

const stateOf = (index) => game.getSnapshot().cells[index].state;
const lastCursor = () => cursors.at(-1);

function press(code, init = {}, target = field) {
  const keys = {
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    Space: " ",
    KeyF: "f",
  };
  const event = new KeyboardEvent("keydown", {
    key: keys[code] ?? code,
    code,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function moveTo(index) {
  // walk from the current cursor: first to cell 0, then right and down
  while (lastCursor() !== 0) {
    press(lastCursor() % 5 > 0 ? "ArrowLeft" : "ArrowUp");
  }
  for (let i = 0; i < index % 5; i++) press("ArrowRight");
  for (let i = 0; i < Math.floor(index / 5); i++) press("ArrowDown");
}

beforeEach(() => {
  document.body.innerHTML =
    '<div class="field" id="field" tabindex="0"></div><div id="outside"></div>';
  field = document.getElementById("field");
  game = gameWithMines(WALL);
  const renderer = createFieldRenderer(field);
  renderer.render(game.getSnapshot());
  game.subscribe(({ snapshot }) => renderer.render(snapshot));
  cursors = [];
  input = createKeyboardInput({
    field,
    game,
    onCursor: (index) => cursors.push(index),
  });
});

describe("keyboard: cursor", () => {
  it("starts on the first cell", () => {
    expect(cursors).toEqual([0]);
    expect(input.getCursor()).toBe(0);
  });

  it("moves with the arrow keys", () => {
    press("ArrowRight");
    press("ArrowDown");
    expect(lastCursor()).toBe(6);
    press("ArrowLeft");
    expect(lastCursor()).toBe(5);
    press("ArrowUp");
    expect(lastCursor()).toBe(0);
  });

  it("stops at the field borders instead of wrapping", () => {
    press("ArrowLeft");
    press("ArrowUp");
    expect(cursors).toEqual([0]);
    for (let i = 0; i < 6; i++) press("ArrowRight");
    expect(lastCursor()).toBe(4); // not 5, the first cell of the next row
    for (let i = 0; i < 4; i++) press("ArrowDown");
    expect(lastCursor()).toBe(14);
  });

  it("keeps the page from scrolling on arrow keys", () => {
    expect(press("ArrowDown").defaultPrevented).toBe(true);
    expect(press("ArrowLeft").defaultPrevented).toBe(true);
  });

  it("goes back to the first cell on a new game", () => {
    press("ArrowRight");
    press("ArrowDown");
    game.newGame();
    expect(lastCursor()).toBe(0);
    expect(input.getCursor()).toBe(0);
  });

  it("starts from the first cell in a field of another size", () => {
    moveTo(14);
    game.newGame({ width: 9, height: 9, mines: 10 });
    press("ArrowRight");
    expect(lastCursor()).toBe(1);
  });
});

describe("keyboard: Space", () => {
  it("opens the closed cell under the cursor", () => {
    moveTo(6);
    press("Space");
    expect(stateOf(6)).toBe("open");
    expect(stateOf(5)).toBe("closed");
  });

  it("opens a cell with a question mark", () => {
    moveTo(6);
    press("KeyF");
    press("KeyF");
    press("Space");
    expect(stateOf(6)).toBe("open");
  });

  it("does not open a flagged cell", () => {
    moveTo(6);
    press("KeyF");
    press("Space");
    expect(stateOf(6)).toBe("flag");
  });

  it("does a chord on an opened number", () => {
    game.open(6);
    [2, 7, 12].forEach((i) => game.toggleMark(i));
    moveTo(6);
    press("Space");
    [0, 1, 5, 10, 11].forEach((i) => expect(stateOf(i)).toBe("open"));
  });

  it("loses on a wrong chord, like the mouse does", () => {
    game.open(6);
    [0, 1, 5].forEach((i) => game.toggleMark(i));
    moveTo(6);
    press("Space");
    expect(game.getSnapshot().state).toBe("lost");
  });

  it("does nothing on an opened empty cell", () => {
    game.open(0);
    const before = JSON.stringify(game.getSnapshot());
    press("Space");
    expect(JSON.stringify(game.getSnapshot())).toBe(before);
  });

  it("keeps the page from scrolling", () => {
    expect(press("Space").defaultPrevented).toBe(true);
  });

  it("ignores key repeat", () => {
    game.open(6);
    [2, 7, 12].forEach((i) => game.toggleMark(i));
    moveTo(6);
    press("Space", { repeat: true });
    expect(stateOf(0)).toBe("closed");
    press("Space");
    expect(stateOf(0)).toBe("open");
  });
});

describe("keyboard: F", () => {
  it("cycles flag, question mark and closed under the cursor", () => {
    moveTo(6);
    const seen = [];
    for (let i = 0; i < 3; i++) {
      press("KeyF");
      seen.push(stateOf(6));
    }
    expect(seen).toEqual(["flag", "question", "closed"]);
  });

  it("works with Shift, and does not depend on the keyboard layout", () => {
    press("KeyF", { shiftKey: true, key: "F" });
    expect(stateOf(0)).toBe("flag");
    press("KeyF", { key: "а" }); // the F key on a Russian layout
    expect(stateOf(0)).toBe("question");
  });

  it("ignores key repeat", () => {
    press("KeyF", { repeat: true });
    expect(stateOf(0)).toBe("closed");
  });
});

describe("keyboard: other keys and conditions", () => {
  it("leaves browser shortcuts alone (Ctrl, Alt, Meta)", () => {
    for (const modifier of ["ctrlKey", "altKey", "metaKey"]) {
      const event = press("KeyF", { [modifier]: true });
      expect(event.defaultPrevented).toBe(false);
    }
    expect(stateOf(0)).toBe("closed");
  });

  it("ignores other keys without cancelling them", () => {
    const event = press("KeyA");
    expect(event.defaultPrevented).toBe(false);
    expect(cursors).toEqual([0]);
  });

  it("only reacts when the field has the keyboard focus", () => {
    press("Space", {}, document.getElementById("outside"));
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { code: "Space", key: " " }),
    );
    expect(game.getSnapshot().state).toBe("ready");
  });

  it("does nothing after the game is over", () => {
    game.open(2); // a mine
    press("Space");
    press("KeyF");
    expect(stateOf(0)).toBe("closed");
  });

  it("stops listening after destroy()", () => {
    input.destroy();
    press("Space");
    press("ArrowRight");
    expect(game.getSnapshot().state).toBe("ready");
    expect(cursors).toEqual([0]);
  });
});
