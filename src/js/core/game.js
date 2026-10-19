import { createBoard, getNeighbors } from "./board.js";
import { createEmitter } from "./emitter.js";
import { LEVELS } from "./levels.js";

/**
 * @typedef {"ready"|"playing"|"won"|"lost"} GameState
 * @typedef {"closed"|"flag"|"question"|"open"|"exploded"|"mine"|"wrongFlag"} CellViewState
 * @typedef {{state: CellViewState, adjacent: number}} CellView
 * @typedef {{
 *   state: GameState, width: number, height: number, mines: number, marks: boolean,
 *   cells: CellView[]
 * }} Snapshot
 * @typedef {{type: "new"|"start"|"win"|"lose"|"change", snapshot: Snapshot}} GameEvent
 */

/**
 * Creates a Minesweeper game. The game is pure logic: randomness is injected,
 * the UI reads `getSnapshot()` and listens to events from `subscribe()`.
 *
 * Event types (one command can emit several, in this order):
 * - "new"    a new game was created;
 * - "start"  the first cell was opened;
 * - "win"    the last safe cell was opened;
 * - "lose"   a mine was opened;
 * - "change" the field changed and no other event described it.
 * Every event carries the snapshot taken after the whole command.
 *
 * Cell states in a snapshot: "closed", "flag", "question", "open" (with `adjacent`).
 * After a loss: "exploded" (the opened mine), "mine" (other mines), "wrongFlag".
 * After a win the remaining mines are shown as "flag".
 *
 * @param {{
 *   random: () => number,
 *   config?: {width: number, height: number, mines: number},
 *   marks?: boolean
 * }} options `random` returns a number in [0, 1), like Math.random.
 */
export function createGame({ random, config = LEVELS.beginner, marks = true }) {
  const emitter = createEmitter();
  let board;
  let cellStates; // "closed" | "flag" | "question" | "open"
  let state;
  let exploded; // indices of the mines that were opened
  let safeOpened; // number of opened cells without a mine
  let currentConfig = config;
  let marksEnabled = marks;

  function reset(newConfig) {
    currentConfig = newConfig;
    board = createBoard({ ...newConfig, random });
    cellStates = board.cells.map(() => "closed");
    state = "ready";
    exploded = new Set();
    safeOpened = 0;
  }

  function isOver() {
    return state === "won" || state === "lost";
  }

  function viewCell(index) {
    const cell = board.cells[index];
    const cellState = cellStates[index];
    if (cellState === "open") {
      return exploded.has(index)
        ? { state: "exploded", adjacent: 0 }
        : { state: "open", adjacent: cell.adjacent };
    }
    if (state === "lost" && cell.mine && cellState !== "flag") {
      return { state: "mine", adjacent: 0 };
    }
    if (state === "lost" && !cell.mine && cellState === "flag") {
      return { state: "wrongFlag", adjacent: 0 };
    }
    return { state: cellState, adjacent: 0 };
  }

  function getSnapshot() {
    return {
      state,
      width: board.width,
      height: board.height,
      mines: currentConfig.mines,
      marks: marksEnabled,
      cells: board.cells.map((_, index) => viewCell(index)),
    };
  }

  /** Emits events one by one; all of them carry the final snapshot. */
  function emitAll(types) {
    const snapshot = getSnapshot();
    types.forEach((type) => emitter.emit({ type, snapshot }));
  }

  function emit(type) {
    emitAll([type]);
  }

  function isValidIndex(index) {
    return Number.isInteger(index) && index >= 0 && index < cellStates.length;
  }

  /** Flags block opening; closed cells and cells with "?" can be opened. */
  function isOpenable(index) {
    return cellStates[index] === "closed" || cellStates[index] === "question";
  }

  /** Next state of a closed cell in the right-click cycle. */
  const NEXT_MARK = {
    closed: () => "flag",
    flag: () => (marksEnabled ? "question" : "closed"),
    question: () => "closed",
  };

  /** Opens `start` and, through cells with no adjacent mines, everything reachable. */
  function revealFrom(start) {
    const pending = [start];
    while (pending.length > 0) {
      const index = pending.pop();
      if (!isOpenable(index)) {
        continue;
      }
      cellStates[index] = "open";
      if (board.cells[index].mine) {
        exploded.add(index);
        continue;
      }
      safeOpened++;
      if (board.cells[index].adjacent === 0) {
        pending.push(...getNeighbors(board.width, board.height, index));
      }
    }
  }

  /** Remaining mines are flagged for the player when the game is won. */
  function flagAllMines() {
    board.cells.forEach((cell, index) => {
      if (cell.mine) {
        cellStates[index] = "flag";
      }
    });
  }

  /**
   * Opens the given cells as one command, then decides whether the game started,
   * was lost or was won, and emits the matching events.
   */
  function openCells(indices) {
    const types = [];
    if (state === "ready") {
      state = "playing";
      types.push("start");
    }
    indices.forEach(revealFrom);
    if (exploded.size > 0) {
      state = "lost";
      types.push("lose");
    } else if (safeOpened === board.cells.length - currentConfig.mines) {
      state = "won";
      flagAllMines();
      types.push("win");
    }
    emitAll(types.length > 0 ? types : ["change"]);
  }

  reset(config);

  return {
    getSnapshot,
    subscribe: emitter.subscribe,

    /** Starts a new game, optionally with another field size. */
    newGame(newConfig = currentConfig) {
      reset(newConfig);
      emit("new");
    },

    /** Switches the Marks (?) setting; it affects the next right-click cycles. */
    setMarks(enabled) {
      marksEnabled = enabled;
      emit("change");
    },

    /** Right click: closed -> flag -> "?" -> closed ("?" is skipped when Marks are off). */
    toggleMark(index) {
      if (isOver() || !isValidIndex(index) || cellStates[index] === "open") {
        return;
      }
      cellStates[index] = NEXT_MARK[cellStates[index]]();
      emit("change");
    },

    /** Opens a closed cell; an empty cell (0) opens its neighbours too. */
    open(index) {
      if (isOver() || !isValidIndex(index) || !isOpenable(index)) {
        return;
      }
      openCells([index]);
    },
  };
}
