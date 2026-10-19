import { createBoard, getNeighbors } from "./board.js";
import { createEmitter } from "./emitter.js";
import { LEVELS } from "./levels.js";

/**
 * @typedef {"ready"|"playing"|"won"|"lost"} GameState
 * @typedef {{state: "closed"|"flag"|"question"|"open", adjacent: number}} CellView
 * @typedef {{
 *   state: GameState, width: number, height: number, mines: number, marks: boolean,
 *   cells: CellView[]
 * }} Snapshot
 * @typedef {{type: "new"|"start"|"change", snapshot: Snapshot}} GameEvent
 */

/**
 * Creates a Minesweeper game. The game is pure logic: randomness is injected,
 * the UI reads `getSnapshot()` and listens to events from `subscribe()`.
 *
 * Event types (one command can emit several, in this order):
 * - "new"    a new game was created;
 * - "start"  the first cell was opened;
 * - "change" the field changed and no other event described it.
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
  let currentConfig = config;
  let marksEnabled = marks;

  function reset(newConfig) {
    currentConfig = newConfig;
    board = createBoard({ ...newConfig, random });
    cellStates = board.cells.map(() => "closed");
    state = "ready";
  }

  function getSnapshot() {
    return {
      state,
      width: board.width,
      height: board.height,
      mines: currentConfig.mines,
      marks: marksEnabled,
      cells: board.cells.map((cell, index) => ({
        state: cellStates[index],
        adjacent: cellStates[index] === "open" ? cell.adjacent : 0,
      })),
    };
  }

  function emit(type) {
    emitter.emit({ type, snapshot: getSnapshot() });
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
      if (board.cells[index].adjacent === 0) {
        pending.push(...getNeighbors(board.width, board.height, index));
      }
    }
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
      if (!isValidIndex(index) || cellStates[index] === "open") {
        return;
      }
      cellStates[index] = NEXT_MARK[cellStates[index]]();
      emit("change");
    },

    /** Opens a closed cell; an empty cell (0) opens its neighbours too. */
    open(index) {
      if (!isValidIndex(index) || !isOpenable(index)) {
        return;
      }
      revealFrom(index);
      if (state === "ready") {
        state = "playing";
        emit("start");
      } else {
        emit("change");
      }
    },
  };
}
