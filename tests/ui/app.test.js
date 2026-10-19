import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { startApp } from "../../src/js/ui/app.js";
import { createFakeScheduler, randomForMines } from "../core/helpers.js";

// Beginner board (9x9): a wall of mines in column 4 plus one mine in the corner,
// so opening the bottom-right corner floods only the right part of the field
const MINES = [0, 4, 13, 22, 31, 40, 49, 58, 67, 76];

let scheduler;
let app;

beforeEach(() => {
  const html = new DOMParser().parseFromString(
    readFileSync("index.html", "utf8"),
    "text/html",
  );
  document.body.innerHTML = html.body.innerHTML;
  scheduler = createFakeScheduler();
  app = startApp({
    document,
    random: randomForMines(81, MINES),
    scheduler,
  });
});

const cell = (index) => document.querySelector(`.cell[data-index="${index}"]`);
const digits = (selector) =>
  [...document.querySelectorAll(`${selector} .led__digit`)]
    .map((d) => d.className.replace("led__digit led__digit--", ""))
    .join("");
const smiley = () => document.querySelector(".smiley").className;

describe("startApp", () => {
  it("draws a Beginner field of 81 closed cells", () => {
    expect(document.querySelectorAll(".cell")).toHaveLength(81);
    expect(document.querySelectorAll(".cell--closed")).toHaveLength(81);
    expect(
      document.querySelector(".field").style.getPropertyValue("--columns"),
    ).toBe("9");
  });

  it("shows 010 mines, a zero timer and the normal smiley", () => {
    expect(digits(".led--mines")).toBe("010");
    expect(digits(".led--timer")).toBe("000");
    expect(smiley()).toBe("smiley smiley--normal");
  });

  it("returns the game and the timer", () => {
    expect(app.game.getSnapshot().state).toBe("ready");
    expect(app.timer.getSeconds()).toBe(0);
  });

  it("redraws the field when the game changes", () => {
    app.game.open(80);
    expect(cell(80).classList.contains("cell--open")).toBe(true);
    expect(document.querySelectorAll(".cell--open").length).toBeGreaterThan(1);
  });

  it("updates the mine counter when flags are placed", () => {
    app.game.toggleMark(40);
    expect(cell(40).classList.contains("cell--flag")).toBe(true);
    expect(digits(".led--mines")).toBe("009");
  });

  it("starts the timer at the first open and redraws it every second", () => {
    app.game.open(80);
    expect(digits(".led--timer")).toBe("001");
    scheduler.advance(2000);
    expect(digits(".led--timer")).toBe("003");
  });

  it("shows the dead smiley, the exploded mine and a stopped timer after a loss", () => {
    app.game.open(80);
    scheduler.advance(1000);
    app.game.open(0);
    expect(smiley()).toBe("smiley smiley--dead");
    expect(cell(0).classList.contains("cell--exploded")).toBe(true);
    scheduler.advance(5000);
    expect(digits(".led--timer")).toBe("002");
  });

  it("resets the field, the counters and the smiley on a new game", () => {
    app.game.toggleMark(40);
    app.game.open(80);
    scheduler.advance(3000);
    app.game.open(0);
    app.game.newGame();
    expect(document.querySelectorAll(".cell--closed")).toHaveLength(81);
    expect(digits(".led--mines")).toBe("010");
    expect(digits(".led--timer")).toBe("000");
    expect(smiley()).toBe("smiley smiley--normal");
  });
});
