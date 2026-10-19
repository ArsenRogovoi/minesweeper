import { createGame } from "../../src/js/core/game.js";

/**
 * Builds a random() that makes createBoard place mines exactly at `mineIndices`.
 * createBoard picks mines one by one from the list of still free cells, so for
 * ascending indices the k-th pick sits at position (index - k) in that list.
 * The layout repeats for every new board (every `mineIndices.length` calls).
 */
export function randomForMines(total, mineIndices) {
  const sorted = [...mineIndices].sort((a, b) => a - b);
  let calls = 0;
  return () => {
    const k = calls++ % sorted.length;
    return (sorted[k] - k + 0.5) / (total - k);
  };
}

/** Creates a game whose mines are always at `mineIndices`. */
export function gameWithMines({ width, height, mineIndices }, options = {}) {
  return createGame({
    config: { width, height, mines: mineIndices.length },
    random: randomForMines(width * height, mineIndices),
    ...options,
  });
}

/** Collects every event emitted by the game. */
export function recordEvents(game) {
  const events = [];
  game.subscribe((event) => events.push(event));
  return events;
}

/**
 * Manual replacement for setInterval / clearInterval / setTimeout / clearTimeout.
 * `advance(ms)` runs the due callbacks in time order.
 */
export function createFakeScheduler() {
  let now = 0;
  let nextHandle = 1;
  const intervals = new Map();

  return {
    setInterval(callback, every) {
      const handle = nextHandle++;
      intervals.set(handle, { callback, every, next: now + every });
      return handle;
    },
    clearInterval(handle) {
      intervals.delete(handle);
    },
    setTimeout(callback, delay) {
      const handle = nextHandle++;
      intervals.set(handle, {
        callback,
        every: delay,
        next: now + delay,
        once: true,
      });
      return handle;
    },
    clearTimeout(handle) {
      intervals.delete(handle);
    },
    advance(ms) {
      const target = now + ms;
      for (;;) {
        const [handle, due] =
          [...intervals.entries()]
            .filter(([, interval]) => interval.next <= target)
            .sort(([, a], [, b]) => a.next - b.next)[0] ?? [];
        if (!due) {
          break;
        }
        now = due.next;
        if (due.once) {
          intervals.delete(handle);
        } else {
          due.next += due.every;
        }
        due.callback();
      }
      now = target;
    },
    /** Number of intervals that are still scheduled. */
    get activeCount() {
      return intervals.size;
    },
  };
}
