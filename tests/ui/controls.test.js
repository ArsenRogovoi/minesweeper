import { beforeEach, describe, expect, it } from "vitest";
import { createControls } from "../../src/js/ui/controls.js";
import { gameWithMines, recordEvents } from "../core/helpers.js";

// 4x4 board with one mine in the top-left corner
const CORNER_MINE = { width: 4, height: 4, mineIndices: [0] };

let game;
let events;
let smiley;
let controls;

beforeEach(() => {
  document.body.innerHTML =
    '<button class="smiley"></button><div id="other"></div>';
  smiley = document.querySelector(".smiley");
  game = gameWithMines(CORNER_MINE);
  events = recordEvents(game);
  controls = createControls({ document, smiley, game });
});

const press = (key, target = document.body) => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

describe("smiley", () => {
  it("starts a new game when clicked", () => {
    game.open(5);
    smiley.click();
    expect(game.getSnapshot().state).toBe("ready");
    expect(events.map((e) => e.type)).toEqual(["start", "new"]);
  });

  it("starts a new game after a loss", () => {
    game.open(0);
    expect(game.getSnapshot().state).toBe("lost");
    smiley.click();
    expect(game.getSnapshot().state).toBe("ready");
  });

  it("keeps the current field size", () => {
    game.newGame({ width: 9, height: 9, mines: 10 });
    smiley.click();
    expect(game.getSnapshot()).toMatchObject({
      width: 9,
      height: 9,
      mines: 10,
    });
  });
});

describe("F2", () => {
  it("starts a new game", () => {
    game.open(5);
    press("F2");
    expect(game.getSnapshot().state).toBe("ready");
  });

  it("works wherever the focus is, and the browser default is cancelled", () => {
    game.open(5);
    const event = press("F2", document.getElementById("other"));
    expect(game.getSnapshot().state).toBe("ready");
    expect(event.defaultPrevented).toBe(true);
  });

  it("starts a new game after a win", () => {
    game.open(15);
    expect(game.getSnapshot().state).toBe("won");
    press("F2");
    expect(game.getSnapshot().state).toBe("ready");
  });

  it("is the only key handled here", () => {
    game.open(5);
    const event = press("F3");
    press("Enter");
    expect(game.getSnapshot().state).toBe("playing");
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("destroy", () => {
  it("stops reacting to the smiley and F2", () => {
    controls.destroy();
    game.open(5);
    smiley.click();
    press("F2");
    expect(game.getSnapshot().state).toBe("playing");
  });
});
