import { beforeEach, describe, expect, it } from "vitest";
import { createFieldRenderer } from "../../src/js/ui/field.js";
import { createTouchInput, LONG_PRESS_MS } from "../../src/js/ui/touch.js";
import { createFakeScheduler, gameWithMines } from "../core/helpers.js";

// 5x3 board, the mines (2, 7, 12) form a wall in the middle column:
//   0 1 * . .
//   0 3 * . .
//   0 1 * . .
const WALL = { width: 5, height: 3, mineIndices: [2, 7, 12] };

let game;
let field;
let scheduler;
let feedback;
let input;

function fire(type, element, init = {}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerType: "touch",
    pointerId: 1,
    ...init,
  });
  element.dispatchEvent(event);
  return event;
}
const finger = {
  down: (element, init) => fire("pointerdown", element, init),
  up: (element, init) => fire("pointerup", element, init),
  move: (element, init) => fire("pointermove", element, init),
  cancel: (element, init) => fire("pointercancel", element, init),
};

const cell = (index) => field.querySelector(`.cell[data-index="${index}"]`);
const stateOf = (index) => game.getSnapshot().cells[index].state;
const lastFeedback = () => feedback.at(-1);

function setup(layout = WALL) {
  document.body.innerHTML =
    '<div id="outside"></div><div class="field" id="field"></div>';
  field = document.getElementById("field");
  game = gameWithMines(layout);
  const renderer = createFieldRenderer(field);
  renderer.render(game.getSnapshot());
  game.subscribe(({ snapshot }) => renderer.render(snapshot));
  scheduler = createFakeScheduler();
  feedback = [];
  input = createTouchInput({
    document,
    field,
    game,
    scheduler,
    onFeedback: (value) => feedback.push(value),
  });
}

beforeEach(() => setup());

describe("touch: tap", () => {
  it("opens a closed cell on a tap", () => {
    finger.down(cell(6));
    expect(stateOf(6)).toBe("closed");
    finger.up(cell(6));
    expect(stateOf(6)).toBe("open");
  });

  it("opens a cell with a question mark", () => {
    game.toggleMark(6);
    game.toggleMark(6);
    expect(stateOf(6)).toBe("question");
    finger.down(cell(6));
    finger.up(cell(6));
    expect(stateOf(6)).toBe("open");
  });

  it("does not open a flagged cell", () => {
    game.toggleMark(6);
    finger.down(cell(6));
    finger.up(cell(6));
    expect(stateOf(6)).toBe("flag");
  });

  it("shows the cell as pressed while the finger is down", () => {
    finger.down(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [6], pressing: true });
    expect(input.isPressing()).toBe(true);
    finger.up(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
    expect(input.isPressing()).toBe(false);
  });

  it("works with a pen too", () => {
    finger.down(cell(6), { pointerType: "pen" });
    finger.up(cell(6), { pointerType: "pen" });
    expect(stateOf(6)).toBe("open");
  });

  it("ignores the mouse", () => {
    finger.down(cell(6), { pointerType: "mouse" });
    finger.up(cell(6), { pointerType: "mouse" });
    expect(stateOf(6)).toBe("closed");
    expect(feedback).toEqual([]);
  });

  it("does nothing once the game is over", () => {
    game.open(7); // a mine: lost
    finger.down(cell(6));
    finger.up(cell(6));
    expect(stateOf(6)).toBe("closed");
    expect(feedback).toEqual([]);
  });
});

describe("touch: long press", () => {
  it("is 400 ms (decision P5)", () => {
    expect(LONG_PRESS_MS).toBe(400);
  });

  it("flags a closed cell after the long press, without waiting for the release", () => {
    finger.down(cell(6));
    scheduler.advance(LONG_PRESS_MS - 1);
    expect(stateOf(6)).toBe("closed");
    scheduler.advance(1);
    expect(stateOf(6)).toBe("flag");
  });

  it("does not open the cell on release after a long press", () => {
    finger.down(cell(6));
    scheduler.advance(LONG_PRESS_MS);
    finger.up(cell(6));
    expect(stateOf(6)).toBe("flag");
  });

  it("clears the pressed look when the flag is placed", () => {
    finger.down(cell(6));
    scheduler.advance(LONG_PRESS_MS);
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: true });
    finger.up(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
  });

  it("cycles flag, question mark and closed on repeated long presses", () => {
    const longPress = () => {
      finger.down(cell(6));
      scheduler.advance(LONG_PRESS_MS);
      finger.up(cell(6));
    };
    longPress();
    expect(stateOf(6)).toBe("flag");
    longPress();
    expect(stateOf(6)).toBe("question");
    longPress();
    expect(stateOf(6)).toBe("closed");
  });

  it("skips the question mark when Marks are off", () => {
    setup();
    game.setMarks(false);
    const longPress = () => {
      finger.down(cell(6));
      scheduler.advance(LONG_PRESS_MS);
      finger.up(cell(6));
    };
    longPress();
    longPress();
    expect(stateOf(6)).toBe("closed");
  });

  it("is cancelled by an early release", () => {
    finger.down(cell(6));
    scheduler.advance(LONG_PRESS_MS - 1);
    finger.up(cell(6));
    scheduler.advance(LONG_PRESS_MS);
    expect(stateOf(6)).toBe("open");
    expect(scheduler.activeCount).toBe(0);
  });

  it("does nothing on an opened cell", () => {
    game.open(6);
    finger.down(cell(6));
    scheduler.advance(LONG_PRESS_MS);
    finger.up(cell(6));
    expect(stateOf(6)).toBe("open");
  });
});

describe("touch: chord", () => {
  // the "3" at index 6 has no flags around it yet
  it("does a chord on a tap on an opened number", () => {
    game.open(6);
    game.toggleMark(2);
    game.toggleMark(7);
    game.toggleMark(12);
    finger.down(cell(6));
    finger.up(cell(6));
    expect(stateOf(5)).toBe("open");
    expect(stateOf(10)).toBe("open");
  });

  it("opens nothing when the flags do not match the number", () => {
    game.open(6);
    game.toggleMark(2);
    finger.down(cell(6));
    finger.up(cell(6));
    expect(stateOf(5)).toBe("closed");
  });

  it("shows no pressed look on an opened number", () => {
    game.open(6);
    finger.down(cell(6));
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: true });
  });
});

describe("touch: moving and cancelling", () => {
  it("cancels the tap when the finger slides to another cell", () => {
    finger.down(cell(6));
    finger.move(cell(8));
    finger.up(cell(8));
    expect(stateOf(6)).toBe("closed");
    expect(stateOf(8)).toBe("closed");
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
  });

  it("cancels the long press when the finger slides away", () => {
    finger.down(cell(6));
    finger.move(cell(8));
    scheduler.advance(LONG_PRESS_MS);
    expect(stateOf(6)).toBe("closed");
    expect(scheduler.activeCount).toBe(0);
  });

  it("keeps the gesture when the finger moves inside the same cell", () => {
    finger.down(cell(6));
    finger.move(cell(6));
    finger.up(cell(6));
    expect(stateOf(6)).toBe("open");
  });

  it("cancels the gesture on pointercancel (a scroll or a system gesture)", () => {
    finger.down(cell(6));
    finger.cancel(cell(6));
    scheduler.advance(LONG_PRESS_MS);
    finger.up(cell(6));
    expect(stateOf(6)).toBe("closed");
    expect(lastFeedback()).toEqual({ pressedCells: [], pressing: false });
  });

  it("does nothing when the finger is lifted outside the field", () => {
    finger.down(cell(6));
    finger.up(document.getElementById("outside"));
    expect(stateOf(6)).toBe("closed");
  });

  it("ignores a second finger while one is down", () => {
    finger.down(cell(6), { pointerId: 1 });
    finger.down(cell(8), { pointerId: 2 });
    finger.up(cell(8), { pointerId: 2 });
    expect(stateOf(8)).toBe("closed");
    finger.up(cell(6), { pointerId: 1 });
    expect(stateOf(6)).toBe("open");
  });
});

describe("touch: destroy", () => {
  it("stops listening after destroy", () => {
    input.destroy();
    finger.down(cell(6));
    finger.up(cell(6));
    expect(stateOf(6)).toBe("closed");
  });
});
