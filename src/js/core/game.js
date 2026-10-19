import { createBoard } from "./board.js";
import { createEmitter } from "./emitter.js";
import { LEVELS } from "./levels.js";

/**
 * @typedef {"ready"|"playing"|"won"|"lost"} GameState
 * @typedef {{state: string, adjacent: number}} CellView
 * @typedef {{
 *   state: GameState, width: number, height: number, mines: number, cells: CellView[]
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
 *   config?: {width: number, height: number, mines: number}
 * }} options `random` returns a number in [0, 1), like Math.random.
 */
export function createGame({ random, config = LEVELS.beginner }) {
  const emitter = createEmitter();
  let board;
  let cellStates; // "closed" | "open" for now; flags and marks come next
  let state;
  let currentConfig = config;

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

  reset(config);

  return {
    getSnapshot,
    subscribe: emitter.subscribe,

    /** Starts a new game, optionally with another field size. */
    newGame(newConfig = currentConfig) {
      reset(newConfig);
      emit("new");
    },

    /** Opens a closed cell. */
    open(index) {
      if (!isValidIndex(index)) {
        return;
      }
      cellStates[index] = "open";
      if (state === "ready") {
        state = "playing";
        emit("start");
      } else {
        emit("change");
      }
    },
  };
}
