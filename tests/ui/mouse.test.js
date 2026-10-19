import { beforeEach, describe, expect, it } from "vitest";
import { createFieldRenderer } from "../../src/js/ui/field.js";
import { createMouseInput } from "../../src/js/ui/mouse.js";
import { gameWithMines } from "../core/helpers.js";

// 5x3 board, the mines (2, 7, 12) form a wall in the middle column:
//   0 1 * . .
//   0 3 * . .
//   0 1 * . .
const WALL = { width: 5, height: 3, mineIndices: [2, 7, 12] };

let game;
let renderer;
let feedback;
let input;
let field;

/** Mouse simulator: tracks the held buttons like a real mouse. */
const BUTTON_BITS = { 0: 1, 1: 4, 2: 2 };
let heldBits;

function fire(type, element, init = {}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerType: "mouse",
    buttons: heldBits,
    ...init,
  });
  element.dispatchEvent(event);
  return event;
}
const mouse = {
  down(element, button = 0) {
    heldBits |= BUTTON_BITS[button];
    return fire("pointerdown", element, { button, buttons: heldBits });
  },
  up(element, button = 0) {
    heldBits &= ~BUTTON_BITS[button];
    return fire("pointerup", element, { button, buttons: heldBits });
  },
  move(element) {
    return fire("pointermove", element);
  },
};

const cell = (index) => field.querySelector(`.cell[data-index="${index}"]`);
const stateOf = (index) => game.getSnapshot().cells[index].state;
const lastFeedback = () => feedback.at(-1);

function setup(layout = WALL, options = {}) {
  heldBits = 0;
  document.body.innerHTML =
    '<div id="outside"></div><div class="field" id="field"></div>';
  field = document.getElementById("field");
  game = gameWithMines(layout, options);
  renderer = createFieldRenderer(field);
  renderer.render(game.getSnapshot());
  game.subscribe(({ snapshot }) => renderer.render(snapshot));
  feedback = [];
  input = createMouseInput({
    document,
    field,
    game,
    onFeedback: (value) => feedback.push(value),
  });
}

beforeEach(() => setup());

describe("mouse: left button", () => {
  it("shows the cell as pressed while the button is held, and the smiley surprised", () => {
    mouse.down(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [6], pressing: true });
    expect(input.isPressing()).toBe(true);
  });

  it("does not open the cell on press, only on release", () => {
    mouse.down(cell(6));
    expect(stateOf(6)).toBe("closed");
    mouse.up(cell(6));
    expect(stateOf(6)).toBe("open");
  });

  it("clears the feedback after the release", () => {
    mouse.down(cell(6));
    mouse.up(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
    expect(input.isPressing()).toBe(false);
  });

  it("moves the pressed look with the mouse and opens the cell under the pointer", () => {
    mouse.down(cell(6));
    mouse.move(cell(8));
    expect(lastFeedback()).toEqual({ pressedCells: [8], pressing: true });
    mouse.up(cell(8));
    expect(stateOf(8)).toBe("open");
    expect(stateOf(6)).toBe("closed");
  });

  it("does nothing when the button is released outside the field", () => {
    mouse.down(cell(6));
    mouse.up(document.getElementById("outside"));
    expect(stateOf(6)).toBe("closed");
    expect(game.getSnapshot().state).toBe("ready");
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
  });

  it("unpresses the cell while the pointer is outside and presses again when it comes back", () => {
    mouse.down(cell(6));
    mouse.move(document.getElementById("outside"));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: true });
    mouse.move(cell(9));
    expect(lastFeedback()).toEqual({ pressedCells: [9], pressing: true });
  });

  it("does not show a pressed look on a flagged cell, and does not open it", () => {
    game.toggleMark(6);
    mouse.down(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: true });
    mouse.up(cell(6));
    expect(stateOf(6)).toBe("flag");
    expect(game.getSnapshot().state).toBe("ready");
  });

  it("presses and opens a cell with a question mark", () => {
    game.toggleMark(6);
    game.toggleMark(6);
    mouse.down(cell(6));
    expect(lastFeedback().pressedCells).toEqual([6]);
    mouse.up(cell(6));
    expect(stateOf(6)).toBe("open");
  });

  it("does not show a pressed look on an opened cell", () => {
    game.open(6);
    mouse.down(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: true });
  });

  it("opens a mine on release and loses the game", () => {
    mouse.down(cell(2));
    mouse.up(cell(2));
    expect(game.getSnapshot().state).toBe("lost");
  });

  it("ignores a release that did not start on the field", () => {
    mouse.down(document.getElementById("outside"));
    mouse.up(cell(6));
    expect(stateOf(6)).toBe("closed");
    expect(feedback).toEqual([]);
  });

  it("ignores moving into the field when the button was pressed outside", () => {
    mouse.down(document.getElementById("outside"));
    mouse.move(cell(6));
    expect(feedback).toEqual([]);
  });

  it("does not react to moving without a pressed button", () => {
    mouse.move(cell(6));
    expect(feedback).toEqual([]);
  });

  it("does not react to touch or pen pointers", () => {
    fire("pointerdown", cell(6), {
      button: 0,
      buttons: 1,
      pointerType: "touch",
    });
    fire("pointerup", cell(6), { button: 0, buttons: 0, pointerType: "touch" });
    expect(stateOf(6)).toBe("closed");
    expect(feedback).toEqual([]);
  });

  it("cancels the gesture when the button was released outside the window", () => {
    mouse.down(cell(6));
    heldBits = 0; // pointerup never arrived
    mouse.move(cell(8));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
    mouse.up(cell(8));
    expect(stateOf(8)).toBe("closed");
  });

  it("cancels the gesture on pointercancel", () => {
    mouse.down(cell(6));
    fire("pointercancel", cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
    mouse.up(cell(6));
    expect(stateOf(6)).toBe("closed");
  });

  it("ignores everything after the game is over", () => {
    game.open(2); // a mine
    feedback.length = 0;
    mouse.down(cell(8));
    expect(feedback).toEqual([]);
    mouse.up(cell(8));
    expect(stateOf(8)).toBe("closed");
  });

  it("stops listening after destroy()", () => {
    input.destroy();
    mouse.down(cell(6));
    mouse.up(cell(6));
    expect(stateOf(6)).toBe("closed");
  });

  it("does not repeat the same feedback twice", () => {
    mouse.down(cell(6));
    mouse.move(cell(6));
    mouse.move(cell(6));
    expect(feedback).toHaveLength(1);
  });
});
