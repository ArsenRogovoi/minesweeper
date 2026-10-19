import { beforeEach, describe, expect, it } from "vitest";
import {
  createStatusRenderer,
  formatLed,
  smileyFace,
} from "../../src/js/ui/status.js";

describe("formatLed", () => {
  it.each([
    [0, ["0", "0", "0"]],
    [7, ["0", "0", "7"]],
    [10, ["0", "1", "0"]],
    [99, ["0", "9", "9"]],
    [123, ["1", "2", "3"]],
    [999, ["9", "9", "9"]],
  ])("shows %i as three digits", (value, digits) => {
    expect(formatLed(value)).toEqual(digits);
  });

  it("shows negative numbers with a minus sign and two digits", () => {
    expect(formatLed(-1)).toEqual(["minus", "0", "1"]);
    expect(formatLed(-12)).toEqual(["minus", "1", "2"]);
    expect(formatLed(-99)).toEqual(["minus", "9", "9"]);
  });

  it("limits the display to -99 and 999", () => {
    expect(formatLed(1000)).toEqual(["9", "9", "9"]);
    expect(formatLed(-100)).toEqual(["minus", "9", "9"]);
    expect(formatLed(-667)).toEqual(["minus", "9", "9"]);
  });
});

describe("smileyFace", () => {
  it("is normal while the game is waiting or running", () => {
    expect(smileyFace("ready")).toBe("normal");
    expect(smileyFace("playing")).toBe("normal");
  });

  it("is surprised while a mouse button is held during the game", () => {
    expect(smileyFace("ready", true)).toBe("surprised");
    expect(smileyFace("playing", true)).toBe("surprised");
  });

  it("is dead after a loss and wearing sunglasses after a win", () => {
    expect(smileyFace("lost")).toBe("dead");
    expect(smileyFace("won")).toBe("won");
  });

  it("ignores the pressed state when the game is over", () => {
    expect(smileyFace("lost", true)).toBe("dead");
    expect(smileyFace("won", true)).toBe("won");
  });
});

describe("status renderer", () => {
  let minesLed;
  let timerLed;
  let smiley;
  let renderer;

  beforeEach(() => {
    const led = (name) =>
      `<div class="led led--${name}">${'<span class="led__digit"></span>'.repeat(3)}</div>`;
    document.body.innerHTML = `${led("mines")}<button class="smiley"></button>${led("timer")}`;
    minesLed = document.querySelector(".led--mines");
    timerLed = document.querySelector(".led--timer");
    smiley = document.querySelector(".smiley");
    renderer = createStatusRenderer({ minesLed, timerLed, smiley });
  });

  const digitClasses = (led) =>
    [...led.querySelectorAll(".led__digit")].map((d) => d.className);

  it("draws the mine counter", () => {
    renderer.renderMines(10);
    expect(digitClasses(minesLed)).toEqual([
      "led__digit led__digit--0",
      "led__digit led__digit--1",
      "led__digit led__digit--0",
    ]);
  });

  it("draws a negative mine counter with a minus sign", () => {
    renderer.renderMines(-3);
    expect(digitClasses(minesLed)).toEqual([
      "led__digit led__digit--minus",
      "led__digit led__digit--0",
      "led__digit led__digit--3",
    ]);
  });

  it("draws the timer", () => {
    renderer.renderTimer(305);
    expect(digitClasses(timerLed)).toEqual([
      "led__digit led__digit--3",
      "led__digit led__digit--0",
      "led__digit led__digit--5",
    ]);
  });

  it("keeps the two counters independent", () => {
    renderer.renderMines(1);
    renderer.renderTimer(2);
    expect(digitClasses(minesLed)[2]).toBe("led__digit led__digit--1");
    expect(digitClasses(timerLed)[2]).toBe("led__digit led__digit--2");
  });

  it("draws the smiley for the game state", () => {
    renderer.renderSmiley("ready");
    expect(smiley.className).toBe("smiley smiley--normal");
    renderer.renderSmiley("playing", true);
    expect(smiley.className).toBe("smiley smiley--surprised");
    renderer.renderSmiley("lost");
    expect(smiley.className).toBe("smiley smiley--dead");
    renderer.renderSmiley("won");
    expect(smiley.className).toBe("smiley smiley--won");
  });
});
