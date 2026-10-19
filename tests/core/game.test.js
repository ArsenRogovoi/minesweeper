import { describe, expect, it } from "vitest";
import { createGame } from "../../src/js/core/game.js";
import { LEVELS } from "../../src/js/core/levels.js";
import { gameWithMines, recordEvents } from "./helpers.js";

// 4x4 board with one mine in the top-left corner:
//   *  1  0  0
//   1  1  0  0
//   0  0  0  0
//   0  0  0  0
const CORNER_MINE = { width: 4, height: 4, mineIndices: [0] };

describe("game states", () => {
  it("starts in the ready state with every cell closed", () => {
    const game = gameWithMines(CORNER_MINE);
    const snapshot = game.getSnapshot();
    expect(snapshot.state).toBe("ready");
    expect(snapshot.width).toBe(4);
    expect(snapshot.height).toBe(4);
    expect(snapshot.mines).toBe(1);
    expect(snapshot.cells).toHaveLength(16);
    expect(snapshot.cells.every((cell) => cell.state === "closed")).toBe(true);
  });

  it("uses the beginner level by default", () => {
    const game = createGame({ random: () => 0.5 });
    const snapshot = game.getSnapshot();
    expect(snapshot).toMatchObject({ width: 9, height: 9, mines: 10 });
  });

  it("moves to playing on the first open", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    expect(game.getSnapshot().state).toBe("playing");
  });

  it("emits a start event on the first open and a change event after", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.open(1);
    expect(events.map((e) => e.type)).toEqual(["start"]);
    game.open(2);
    expect(events.map((e) => e.type)).toEqual(["start", "change"]);
  });

  it("passes the current snapshot with every event", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.open(1);
    expect(events[0].snapshot).toEqual(game.getSnapshot());
  });

  it("stops calling a listener after unsubscribe", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = [];
    const unsubscribe = game.subscribe((event) => events.push(event));
    unsubscribe();
    game.open(1);
    expect(events).toEqual([]);
  });

  it("returns to ready on newGame and emits a new event", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    const events = recordEvents(game);
    game.newGame();
    expect(game.getSnapshot().state).toBe("ready");
    expect(game.getSnapshot().cells.every((c) => c.state === "closed")).toBe(
      true,
    );
    expect(events.map((e) => e.type)).toEqual(["new"]);
  });

  it("switches to another level on newGame(config)", () => {
    const game = gameWithMines(CORNER_MINE);
    game.newGame(LEVELS.expert);
    expect(game.getSnapshot()).toMatchObject({
      width: 30,
      height: 16,
      mines: 99,
    });
  });

  it("does not expose mine positions while the game is on", () => {
    const game = gameWithMines(CORNER_MINE);
    expect(game.getSnapshot().cells[0]).toEqual({
      state: "closed",
      adjacent: 0,
    });
  });

  it("ignores indices outside the board", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.open(-1);
    game.open(16);
    expect(game.getSnapshot().state).toBe("ready");
    expect(events).toEqual([]);
  });
});
