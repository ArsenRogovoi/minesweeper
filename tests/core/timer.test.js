import { describe, expect, it } from "vitest";
import { createTimer, attachTimer } from "../../src/js/core/timer.js";
import { createFakeScheduler, gameWithMines } from "./helpers.js";

// 4x4 board with one mine in the top-left corner, see game.test.js
const CORNER_MINE = { width: 4, height: 4, mineIndices: [0] };

function setup() {
  const scheduler = createFakeScheduler();
  const timer = createTimer({ scheduler });
  const values = [];
  timer.subscribe(({ seconds }) => values.push(seconds));
  return { scheduler, timer, values };
}

describe("timer", () => {
  it("starts at 0 and does not tick until started", () => {
    const { scheduler, timer } = setup();
    scheduler.advance(5000);
    expect(timer.getSeconds()).toBe(0);
    expect(scheduler.activeCount).toBe(0);
  });

  it("shows 1 right after start", () => {
    const { timer, values } = setup();
    timer.start();
    expect(timer.getSeconds()).toBe(1);
    expect(values).toEqual([1]);
  });

  it("adds one second per 1000 ms", () => {
    const { scheduler, timer, values } = setup();
    timer.start();
    scheduler.advance(999);
    expect(timer.getSeconds()).toBe(1);
    scheduler.advance(1);
    expect(timer.getSeconds()).toBe(2);
    scheduler.advance(3000);
    expect(timer.getSeconds()).toBe(5);
    expect(values).toEqual([1, 2, 3, 4, 5]);
  });

  it("ignores a second start while running", () => {
    const { scheduler, timer } = setup();
    timer.start();
    timer.start();
    expect(scheduler.activeCount).toBe(1);
    scheduler.advance(1000);
    expect(timer.getSeconds()).toBe(2);
  });

  it("stops at 999 and releases the scheduler", () => {
    const { scheduler, timer, values } = setup();
    timer.start();
    scheduler.advance(998 * 1000);
    expect(timer.getSeconds()).toBe(999);
    expect(scheduler.activeCount).toBe(0);
    scheduler.advance(10 * 1000);
    expect(timer.getSeconds()).toBe(999);
    expect(values).toHaveLength(999);
  });

  it("keeps the value when stopped", () => {
    const { scheduler, timer } = setup();
    timer.start();
    scheduler.advance(2000);
    timer.stop();
    scheduler.advance(5000);
    expect(timer.getSeconds()).toBe(3);
    expect(scheduler.activeCount).toBe(0);
  });

  it("can be stopped when it is not running", () => {
    const { timer, values } = setup();
    timer.stop();
    expect(timer.getSeconds()).toBe(0);
    expect(values).toEqual([]);
  });

  it("resets to 0, stops ticking and tells the listeners", () => {
    const { scheduler, timer, values } = setup();
    timer.start();
    scheduler.advance(2000);
    timer.reset();
    expect(timer.getSeconds()).toBe(0);
    expect(scheduler.activeCount).toBe(0);
    expect(values.at(-1)).toBe(0);
    scheduler.advance(5000);
    expect(timer.getSeconds()).toBe(0);
  });

  it("counts from 1 again when started after a reset", () => {
    const { scheduler, timer } = setup();
    timer.start();
    scheduler.advance(4000);
    timer.reset();
    timer.start();
    expect(timer.getSeconds()).toBe(1);
    scheduler.advance(1000);
    expect(timer.getSeconds()).toBe(2);
  });

  it("stops notifying a listener after it unsubscribes", () => {
    const { timer } = setup();
    const seen = [];
    const unsubscribe = timer.subscribe(({ seconds }) => seen.push(seconds));
    unsubscribe();
    timer.start();
    expect(seen).toEqual([]);
  });
});

describe("attachTimer", () => {
  function attached(config = CORNER_MINE) {
    const scheduler = createFakeScheduler();
    const timer = createTimer({ scheduler });
    const game = gameWithMines(config);
    const detach = attachTimer(game, timer);
    return { scheduler, timer, game, detach };
  }

  // Wall of mines: opening cell 6 does not finish the game, see game.test.js
  const WALL = { width: 5, height: 3, mineIndices: [2, 7, 12] };

  it("does not start before the first open", () => {
    const { scheduler, timer, game } = attached();
    game.toggleMark(3);
    scheduler.advance(3000);
    expect(timer.getSeconds()).toBe(0);
  });

  it("starts with the first open and shows 1", () => {
    const { timer, game } = attached(WALL);
    game.open(6);
    expect(timer.getSeconds()).toBe(1);
  });

  it("keeps counting while the game is on and does not restart on later moves", () => {
    const { scheduler, timer, game } = attached(WALL);
    game.open(6);
    scheduler.advance(2000);
    game.toggleMark(2);
    game.open(1);
    expect(timer.getSeconds()).toBe(3);
  });

  it("stops when the game is won", () => {
    const { scheduler, timer, game } = attached(WALL);
    game.open(6);
    scheduler.advance(2000);
    game.open(14); // right half
    game.open(0); // left half: last safe cells
    expect(game.getSnapshot().state).toBe("won");
    scheduler.advance(5000);
    expect(timer.getSeconds()).toBe(3);
    expect(scheduler.activeCount).toBe(0);
  });

  it("stops when the game is lost", () => {
    const { scheduler, timer, game } = attached(WALL);
    game.open(6);
    scheduler.advance(4000);
    game.open(2);
    scheduler.advance(5000);
    expect(timer.getSeconds()).toBe(5);
    expect(scheduler.activeCount).toBe(0);
  });

  it("shows 1 and stops when the first click hits a mine", () => {
    const { scheduler, timer, game } = attached(WALL);
    game.open(2);
    scheduler.advance(5000);
    expect(timer.getSeconds()).toBe(1);
    expect(scheduler.activeCount).toBe(0);
  });

  it("resets on a new game and starts again with the next first open", () => {
    const { scheduler, timer, game } = attached(WALL);
    game.open(6);
    scheduler.advance(3000);
    game.newGame();
    expect(timer.getSeconds()).toBe(0);
    expect(scheduler.activeCount).toBe(0);
    game.open(6);
    expect(timer.getSeconds()).toBe(1);
    scheduler.advance(1000);
    expect(timer.getSeconds()).toBe(2);
  });

  it("stops following the game after detach", () => {
    const { timer, game, detach } = attached(WALL);
    detach();
    game.open(6);
    expect(timer.getSeconds()).toBe(0);
  });
});
