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

describe("opening cells", () => {
  const openIndices = (game) =>
    game
      .getSnapshot()
      .cells.flatMap((cell, i) => (cell.state === "open" ? [i] : []));

  it("opens a numbered cell and shows its adjacent mine count", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    const { cells } = game.getSnapshot();
    expect(cells[5]).toEqual({ state: "open", adjacent: 1 });
    expect(openIndices(game)).toEqual([5]);
  });

  it("opens an empty cell and floods through all connected empty cells", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(15);
    // everything except the mine in the corner
    expect(openIndices(game)).toEqual([...Array(15).keys()].map((i) => i + 1));
    expect(game.getSnapshot().cells[0].state).toBe("closed");
  });

  it("stops the flood at numbered cells and does not open behind them", () => {
    // 5x5 with the only mine in the centre: the ring around it holds 1s
    const game = gameWithMines({ width: 5, height: 5, mineIndices: [12] });
    game.open(0);
    const { cells } = game.getSnapshot();
    expect(cells.filter((c) => c.state === "open")).toHaveLength(24);
    expect(cells[12].state).toBe("closed");
    expect(cells[6]).toEqual({ state: "open", adjacent: 1 });
  });

  it("floods only up to numbers when a wall of numbers splits the field", () => {
    // 5x3, mines in column 2 (indices 2, 7, 12) split the field in two halves
    const game = gameWithMines({
      width: 5,
      height: 3,
      mineIndices: [2, 7, 12],
    });
    game.open(0);
    expect(openIndices(game)).toEqual([0, 1, 5, 6, 10, 11]);
  });

  it("does not wrap the flood around the field edges", () => {
    // The whole right column is mined; the flood from the left must stop at
    // the column of numbers next to it and never reach the mines by wrapping
    const mineIndices = Array.from({ length: 9 }, (_, row) => row * 9 + 8);
    const game = gameWithMines({ width: 9, height: 9, mineIndices });
    game.open(0);
    const { cells } = game.getSnapshot();
    expect(cells.filter((c) => c.state === "open")).toHaveLength(72);
    expect(mineIndices.every((i) => cells[i].state === "closed")).toBe(true);
  });

  it("ignores an already opened cell", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    const events = recordEvents(game);
    game.open(5);
    expect(events).toEqual([]);
  });

  it("emits a single change event for a whole flood", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    const events = recordEvents(game);
    game.open(15);
    expect(events.map((e) => e.type)).toEqual(["change"]);
  });
});

describe("marks", () => {
  const stateOf = (game, index) => game.getSnapshot().cells[index].state;

  it("cycles closed -> flag -> question -> closed when Marks are on", () => {
    const game = gameWithMines(CORNER_MINE);
    const seen = [stateOf(game, 3)];
    for (let i = 0; i < 3; i++) {
      game.toggleMark(3);
      seen.push(stateOf(game, 3));
    }
    expect(seen).toEqual(["closed", "flag", "question", "closed"]);
  });

  it("cycles closed -> flag -> closed when Marks are off", () => {
    const game = gameWithMines(CORNER_MINE, { marks: false });
    const seen = [];
    for (let i = 0; i < 3; i++) {
      game.toggleMark(3);
      seen.push(stateOf(game, 3));
    }
    expect(seen).toEqual(["flag", "closed", "flag"]);
  });

  it("has Marks on by default and reports the setting in the snapshot", () => {
    const game = gameWithMines(CORNER_MINE);
    expect(game.getSnapshot().marks).toBe(true);
    game.setMarks(false);
    expect(game.getSnapshot().marks).toBe(false);
  });

  it("emits a change event when the Marks setting changes", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.setMarks(false);
    expect(events.map((e) => e.type)).toEqual(["change"]);
  });

  it("lets an existing question mark go back to closed after Marks are turned off", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(3);
    game.toggleMark(3);
    game.setMarks(false);
    expect(stateOf(game, 3)).toBe("question");
    game.toggleMark(3);
    expect(stateOf(game, 3)).toBe("closed");
  });

  it("does not mark opened cells", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    const events = recordEvents(game);
    game.toggleMark(5);
    expect(stateOf(game, 5)).toBe("open");
    expect(events).toEqual([]);
  });

  it("ignores indices outside the board", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.toggleMark(-1);
    game.toggleMark(16);
    expect(events).toEqual([]);
  });

  it("allows marking before the first open without starting the game", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.toggleMark(3);
    expect(game.getSnapshot().state).toBe("ready");
    expect(events.map((e) => e.type)).toEqual(["change"]);
  });

  it("does not open a flagged cell", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(5);
    const events = recordEvents(game);
    game.open(5);
    expect(stateOf(game, 5)).toBe("flag");
    expect(game.getSnapshot().state).toBe("ready");
    expect(events).toEqual([]);
  });

  it("opens a cell with a question mark", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(5);
    game.toggleMark(5);
    game.open(5);
    expect(game.getSnapshot().cells[5]).toEqual({ state: "open", adjacent: 1 });
  });

  it("keeps flags closed during a flood fill", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(10);
    game.open(15);
    expect(stateOf(game, 10)).toBe("flag");
    expect(stateOf(game, 11)).toBe("open");
  });

  it("opens question-marked cells during a flood fill", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(10);
    game.toggleMark(10);
    game.open(15);
    expect(stateOf(game, 10)).toBe("open");
  });

  it("starts with all marks cleared in a new game, keeping the Marks setting", () => {
    const game = gameWithMines(CORNER_MINE);
    game.setMarks(false);
    game.toggleMark(3);
    game.newGame();
    expect(stateOf(game, 3)).toBe("closed");
    expect(game.getSnapshot().marks).toBe(false);
  });
});
