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
    game.open(4);
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
    // everything except the mine in the corner (flagged by the win)
    expect(openIndices(game)).toEqual([...Array(15).keys()].map((i) => i + 1));
    expect(game.getSnapshot().cells[0].state).toBe("flag");
  });

  it("stops the flood at numbered cells and does not open behind them", () => {
    // 5x5 with the only mine in the centre: the ring around it holds 1s
    const game = gameWithMines({ width: 5, height: 5, mineIndices: [12] });
    game.open(0);
    const { cells } = game.getSnapshot();
    expect(cells.filter((c) => c.state === "open")).toHaveLength(24);
    expect(cells[12].state).toBe("flag"); // flagged by the win
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
    const { state, cells } = game.getSnapshot();
    expect(cells.filter((c) => c.state === "open")).toHaveLength(72);
    expect(state).toBe("won"); // wrapping onto the mines would have lost the game
  });

  it("ignores an already opened cell", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    const events = recordEvents(game);
    game.open(5);
    expect(events).toEqual([]);
  });

  it("emits a single event for a whole flood", () => {
    const game = gameWithMines({
      width: 5,
      height: 3,
      mineIndices: [2, 7, 12],
    });
    const events = recordEvents(game);
    game.open(0);
    expect(openIndices(game)).toHaveLength(6);
    expect(events.map((e) => e.type)).toEqual(["start"]);
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

  it("clears existing question marks when Marks are turned off", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(3);
    game.toggleMark(3);
    game.setMarks(false);
    expect(stateOf(game, 3)).toBe("closed");
  });

  it("keeps flags and opened cells when Marks are turned off", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    game.toggleMark(3);
    game.toggleMark(7);
    game.toggleMark(7); // "?"
    game.setMarks(false);
    expect(stateOf(game, 3)).toBe("flag");
    expect(stateOf(game, 5)).toBe("open");
    expect(stateOf(game, 7)).toBe("closed");
  });

  it("keeps question marks when Marks are turned on", () => {
    const game = gameWithMines(CORNER_MINE, { marks: false });
    game.setMarks(true);
    game.toggleMark(3);
    game.toggleMark(3);
    expect(stateOf(game, 3)).toBe("question");
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

describe("loss", () => {
  // 4x4 with mines at 0, 5 and 10
  const MINES = { width: 4, height: 4, mineIndices: [0, 5, 10] };
  const stateOf = (game, index) => game.getSnapshot().cells[index].state;

  it("is lost when a mine is opened, and the clicked mine is exploded", () => {
    const game = gameWithMines(MINES);
    game.open(15);
    game.open(5);
    expect(game.getSnapshot().state).toBe("lost");
    expect(stateOf(game, 5)).toBe("exploded");
  });

  it("emits start and lose when the first click hits a mine", () => {
    const game = gameWithMines(MINES);
    const events = recordEvents(game);
    game.open(5);
    expect(events.map((e) => e.type)).toEqual(["start", "lose"]);
    expect(events[1].snapshot.state).toBe("lost");
  });

  it("emits only lose when a mine is hit during the game", () => {
    const game = gameWithMines(MINES);
    game.open(15);
    const events = recordEvents(game);
    game.open(5);
    expect(events.map((e) => e.type)).toEqual(["lose"]);
  });

  it("reveals the other mines, keeps correct flags and shows wrong flags", () => {
    const game = gameWithMines(MINES);
    game.open(15);
    game.toggleMark(0); // correct flag
    game.toggleMark(1); // wrong flag
    game.toggleMark(10);
    game.toggleMark(10); // question mark on a mine
    game.open(5);
    expect(stateOf(game, 5)).toBe("exploded");
    expect(stateOf(game, 0)).toBe("flag");
    expect(stateOf(game, 1)).toBe("wrongFlag");
    expect(stateOf(game, 10)).toBe("mine");
  });

  it("leaves safe closed cells closed and opened cells opened", () => {
    const game = gameWithMines(MINES);
    game.open(15);
    game.open(5);
    expect(stateOf(game, 1)).toBe("closed");
    expect(stateOf(game, 15)).toBe("open");
    expect(game.getSnapshot().cells[15].adjacent).toBe(1);
  });

  it("ignores opening and marking until a new game", () => {
    const game = gameWithMines(MINES);
    game.open(5);
    const events = recordEvents(game);
    game.open(1);
    game.toggleMark(1);
    expect(stateOf(game, 1)).toBe("closed");
    expect(events).toEqual([]);
  });

  it("can start a new game after a loss", () => {
    const game = gameWithMines(MINES);
    game.open(5);
    game.newGame();
    const snapshot = game.getSnapshot();
    expect(snapshot.state).toBe("ready");
    expect(snapshot.cells.every((c) => c.state === "closed")).toBe(true);
  });
});

describe("win", () => {
  const stateOf = (game, index) => game.getSnapshot().cells[index].state;

  it("is won when the last safe cell is opened", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(15);
    expect(game.getSnapshot().state).toBe("won");
  });

  it("is not won while a safe cell is still closed", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    expect(game.getSnapshot().state).toBe("playing");
  });

  it("emits start and win when one click opens the whole field", () => {
    const game = gameWithMines(CORNER_MINE);
    const events = recordEvents(game);
    game.open(15);
    expect(events.map((e) => e.type)).toEqual(["start", "win"]);
  });

  it("emits only win when the last cell is opened during the game", () => {
    const game = gameWithMines({ width: 4, height: 4, mineIndices: [0, 15] });
    game.open(5);
    const events = recordEvents(game);
    game.open(3); // opens the rest of the field by flood
    expect(events.map((e) => e.type)).toEqual(["win"]);
  });

  it("flags the remaining mines automatically, including question marks", () => {
    const game = gameWithMines({ width: 4, height: 4, mineIndices: [0, 15] });
    game.toggleMark(0); // already flagged: must stay a flag
    game.toggleMark(15);
    game.toggleMark(15); // "?" on a mine
    game.open(3);
    expect(game.getSnapshot().state).toBe("won");
    expect(stateOf(game, 0)).toBe("flag");
    expect(stateOf(game, 15)).toBe("flag");
  });

  it("ignores opening and marking after the win", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(15);
    const events = recordEvents(game);
    game.toggleMark(0);
    game.open(0);
    expect(game.getSnapshot().state).toBe("won");
    expect(stateOf(game, 0)).toBe("flag");
    expect(events).toEqual([]);
  });
});

describe("chord", () => {
  // 5x3, the mines (2, 7, 12) form a wall in the middle column:
  //   0 1 * . .
  //   0 3 * . .     cell 6 touches all three mines, cell 1 touches two
  //   0 1 * . .
  // The right half stays closed, so a chord on the left half cannot win.
  const WALL = { width: 5, height: 3, mineIndices: [2, 7, 12] };
  const stateOf = (game, index) => game.getSnapshot().cells[index].state;
  const states = (game, indices) => indices.map((i) => stateOf(game, i));

  function wallGameAt6(flagged) {
    const game = gameWithMines(WALL);
    game.open(6);
    flagged.forEach((i) => game.toggleMark(i));
    return game;
  }

  it("opens the closed neighbours when the flag count matches the number", () => {
    const game = wallGameAt6([2, 7, 12]);
    game.chord(6);
    expect(states(game, [0, 1, 5, 10, 11])).toEqual(Array(5).fill("open"));
    expect(states(game, [2, 7, 12])).toEqual(Array(3).fill("flag"));
    expect(game.getSnapshot().state).toBe("playing");
  });

  it("floods from a neighbour that turns out to be empty", () => {
    const game = wallGameAt6([2, 7, 12]);
    game.chord(6);
    // cell 0 is empty, so its neighbours open too, but the flood stops at the wall
    expect(game.getSnapshot().cells[0]).toEqual({ state: "open", adjacent: 0 });
    expect(stateOf(game, 3)).toBe("closed");
  });

  it("emits a change event for a successful chord", () => {
    const game = wallGameAt6([2, 7, 12]);
    const events = recordEvents(game);
    game.chord(6);
    expect(events.map((e) => e.type)).toEqual(["change"]);
  });

  it("does nothing when there are fewer flags than the number", () => {
    const game = wallGameAt6([2, 7]);
    const events = recordEvents(game);
    game.chord(6);
    expect(stateOf(game, 0)).toBe("closed");
    expect(events).toEqual([]);
  });

  it("does nothing when there are more flags than the number", () => {
    const game = wallGameAt6([2, 7, 12, 0]);
    const events = recordEvents(game);
    game.chord(6);
    expect(stateOf(game, 1)).toBe("closed");
    expect(events).toEqual([]);
  });

  it("opens neighbours that carry a question mark", () => {
    const game = wallGameAt6([2, 7, 12]);
    game.toggleMark(0);
    game.toggleMark(0); // flag -> "?"
    game.chord(6);
    expect(stateOf(game, 0)).toBe("open");
  });

  it("loses when a flag is wrong and a mine gets opened", () => {
    // mines 2 and 7 flagged, 0 flagged by mistake; mine 12 is opened
    const game = wallGameAt6([2, 7, 0]);
    game.chord(6);
    expect(game.getSnapshot().state).toBe("lost");
    expect(stateOf(game, 12)).toBe("exploded");
    expect(stateOf(game, 0)).toBe("wrongFlag");
    expect(states(game, [2, 7])).toEqual(["flag", "flag"]);
  });

  it("explodes every mine opened by a wrong chord", () => {
    const game = wallGameAt6([0, 1, 5]);
    const events = recordEvents(game);
    game.chord(6);
    expect(states(game, [2, 7, 12])).toEqual(Array(3).fill("exploded"));
    expect(states(game, [0, 1, 5])).toEqual(Array(3).fill("wrongFlag"));
    expect(events.map((e) => e.type)).toEqual(["lose"]);
  });

  it("wins when the chord opens the last safe cell", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(5);
    game.toggleMark(0);
    const events = recordEvents(game);
    game.chord(5);
    expect(game.getSnapshot().state).toBe("won");
    expect(events.map((e) => e.type)).toEqual(["win"]);
  });

  it("does nothing on a number without closed neighbours", () => {
    const game = wallGameAt6([2, 7, 12]);
    game.chord(6);
    const events = recordEvents(game);
    game.chord(6);
    expect(events).toEqual([]);
  });

  it("does nothing on closed, flagged or question-marked cells", () => {
    const game = wallGameAt6([2]);
    game.toggleMark(1);
    game.toggleMark(1);
    game.toggleMark(1); // 1 is closed again, 2 is flagged
    game.toggleMark(5);
    game.toggleMark(5); // 5 has "?"
    const events = recordEvents(game);
    [1, 2, 5].forEach((i) => game.chord(i));
    expect(events).toEqual([]);
  });

  it("does nothing on an empty (0) cell", () => {
    const game = gameWithMines(WALL);
    game.open(14);
    const events = recordEvents(game);
    game.chord(14);
    expect(events).toEqual([]);
  });

  it("ignores indices outside the board", () => {
    const game = wallGameAt6([2, 7, 12]);
    const events = recordEvents(game);
    game.chord(-1);
    game.chord(15);
    expect(events).toEqual([]);
  });

  it("is ignored after the game is over", () => {
    const game = wallGameAt6([0, 1, 5]);
    game.chord(6);
    const events = recordEvents(game);
    game.chord(6);
    expect(events).toEqual([]);
  });
});

describe("mine counter", () => {
  const minesLeft = (game) => game.getSnapshot().minesLeft;

  it("starts at the number of mines", () => {
    expect(minesLeft(gameWithMines(CORNER_MINE))).toBe(1);
    expect(minesLeft(createGame({ random: () => 0.5 }))).toBe(10);
  });

  it("decreases with every flag and recovers when the flag is removed", () => {
    const game = gameWithMines({ width: 4, height: 4, mineIndices: [0, 1, 2] });
    game.toggleMark(5);
    expect(minesLeft(game)).toBe(2);
    game.toggleMark(6);
    expect(minesLeft(game)).toBe(1);
    game.toggleMark(5); // flag -> "?" does not count as a flag
    expect(minesLeft(game)).toBe(2);
    game.toggleMark(5); // "?" -> closed
    expect(minesLeft(game)).toBe(2);
  });

  it("can become negative", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(1);
    game.toggleMark(2);
    game.toggleMark(3);
    expect(minesLeft(game)).toBe(-2);
  });

  it("shows 0 after a win because the remaining mines are flagged", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(15);
    expect(game.getSnapshot().state).toBe("won");
    expect(minesLeft(game)).toBe(0);
  });

  it("counts only the real flags after a loss", () => {
    const game = gameWithMines({ width: 4, height: 4, mineIndices: [0, 5] });
    game.toggleMark(1);
    game.open(5);
    expect(minesLeft(game)).toBe(1);
  });

  it("is restored by a new game", () => {
    const game = gameWithMines(CORNER_MINE);
    game.toggleMark(1);
    game.newGame();
    expect(minesLeft(game)).toBe(1);
  });
});

describe("UI contract", () => {
  it("returns a fresh snapshot each time, so changing one does not affect the game", () => {
    const game = gameWithMines(CORNER_MINE);
    const snapshot = game.getSnapshot();
    snapshot.cells[3].state = "open";
    snapshot.state = "won";
    expect(game.getSnapshot().cells[3].state).toBe("closed");
    expect(game.getSnapshot().state).toBe("ready");
  });

  it("keeps earlier snapshots unchanged when the game moves on", () => {
    const game = gameWithMines(CORNER_MINE);
    const before = game.getSnapshot();
    game.toggleMark(3);
    expect(before.cells[3].state).toBe("closed");
    expect(before.minesLeft).toBe(1);
  });

  it("delivers events to all listeners in order", () => {
    const game = gameWithMines(CORNER_MINE);
    const first = recordEvents(game);
    const second = recordEvents(game);
    game.toggleMark(3);
    game.open(5);
    expect(first.map((e) => e.type)).toEqual(["change", "start"]);
    expect(second).toEqual(first);
  });

  it("allows the first click on a mine (no first-click protection)", () => {
    const game = gameWithMines(CORNER_MINE);
    game.open(0);
    expect(game.getSnapshot().state).toBe("lost");
  });
});
