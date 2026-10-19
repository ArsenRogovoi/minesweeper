import { createEmitter } from "./emitter.js";

const TICK_MS = 1000;
const MAX_SECONDS = 999;

/**
 * Game timer: shows 1 right after `start()`, then adds one second per tick and
 * stops at 999. Time comes from an injected scheduler, so core needs no real timers.
 *
 * @param {{
 *   scheduler: {
 *     setInterval: (callback: () => void, ms: number) => unknown,
 *     clearInterval: (handle: unknown) => void
 *   }
 * }} options the scheduler has the same shape as `window` (setInterval / clearInterval)
 * @returns {{
 *   start: () => void, stop: () => void, reset: () => void, getSeconds: () => number,
 *   subscribe: (listener: (event: {seconds: number}) => void) => () => void
 * }}
 */
export function createTimer({ scheduler }) {
  const emitter = createEmitter();
  let seconds = 0;
  let handle = null;

  function notify() {
    emitter.emit({ seconds });
  }

  function stop() {
    if (handle !== null) {
      scheduler.clearInterval(handle);
      handle = null;
    }
  }

  function tick() {
    seconds++;
    if (seconds >= MAX_SECONDS) {
      stop();
    }
    notify();
  }

  return {
    getSeconds: () => seconds,
    subscribe: emitter.subscribe,
    stop,

    /** Starts counting from 1; does nothing if already running. */
    start() {
      if (handle !== null) {
        return;
      }
      seconds = 1;
      handle = scheduler.setInterval(tick, TICK_MS);
      notify();
    },

    /** Stops counting and sets the timer back to 0. */
    reset() {
      stop();
      seconds = 0;
      notify();
    },
  };
}

/**
 * Makes the timer follow a game: it starts with the first open, stops when the
 * game is won or lost and resets on a new game.
 * @param {{subscribe: Function}} game
 * @param {{start: Function, stop: Function, reset: Function}} timer
 * @returns {() => void} detach function
 */
export function attachTimer(game, timer) {
  const actions = {
    new: () => timer.reset(),
    start: () => timer.start(),
    win: () => timer.stop(),
    lose: () => timer.stop(),
  };
  return game.subscribe(({ type }) => actions[type]?.());
}
