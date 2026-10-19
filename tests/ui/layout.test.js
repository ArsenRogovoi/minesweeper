import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

/** Stage 5 checks the static page structure; behaviour comes with later stages. */
describe("index.html layout", () => {
  beforeAll(() => {
    const html = readFileSync("index.html", "utf8");
    document.documentElement.innerHTML = new DOMParser().parseFromString(
      html,
      "text/html",
    ).documentElement.innerHTML;
  });

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  it("starts with the solid desktop background (decision 31)", () => {
    expect($("body").classList.contains("desktop")).toBe(true);
    expect($("body").classList.contains("desktop--solid")).toBe(true);
  });

  it("has one window with a title bar, menu bar and game area, in this order", () => {
    const windows = $$(".window");
    expect(windows).toHaveLength(1);
    const parts = [...windows[0].children].map((el) => el.className);
    expect(parts).toEqual(["window__titlebar", "menubar", "game"]);
  });

  it("shows an icon placeholder, the title and three decorative buttons", () => {
    const bar = $(".window__titlebar");
    expect(bar.querySelector(".window__icon")).not.toBeNull();
    expect(bar.querySelector(".window__title").textContent).toBe("Minesweeper");
    const buttons = [...bar.querySelectorAll(".window__button")];
    expect(buttons.map((b) => b.className)).toEqual([
      "window__button window__button--minimize",
      "window__button window__button--maximize",
      "window__button window__button--close",
    ]);
    // decorative: not focusable, hidden from assistive technology
    for (const button of buttons) {
      expect(button.tagName).toBe("SPAN");
      expect(button.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("has the Game and Help items in the menu bar", () => {
    const items = $$(".menubar__item").map((el) => el.textContent.trim());
    expect(items).toEqual(["Game", "Help"]);
  });

  it("has a status panel with mine counter, smiley and timer", () => {
    const status = $(".status");
    expect([...status.children].map((el) => el.className)).toEqual([
      "led led--mines",
      "smiley",
      "led led--timer",
    ]);
    expect($(".smiley").tagName).toBe("BUTTON");
    expect($(".smiley").getAttribute("aria-label")).toBe("New game");
  });

  it("shows three digits in each LED counter", () => {
    expect($$(".led--mines .led__digit")).toHaveLength(3);
    expect($$(".led--timer .led__digit")).toHaveLength(3);
  });

  it("has a Beginner-sized field container with 81 closed cells", () => {
    const field = $(".field");
    expect(field.style.getPropertyValue("--columns")).toBe("9");
    const cells = $$(".field .cell");
    expect(cells).toHaveLength(81);
    expect(cells.every((cell) => cell.classList.contains("cell--closed"))).toBe(
      true,
    );
  });

  it("loads the compiled CSS and the entry script", () => {
    expect($('link[rel="stylesheet"]').getAttribute("href")).toBe(
      "css/main.css",
    );
    expect($('script[type="module"]').getAttribute("src")).toBe(
      "src/js/main.js",
    );
  });
});
