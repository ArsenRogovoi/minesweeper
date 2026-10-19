import { beforeAll, describe, expect, it } from "vitest";
import * as sass from "sass";

describe("SCSS", () => {
  let css;

  beforeAll(() => {
    css = sass.compile("src/scss/main.scss").css;
  });

  it("compiles without errors", () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it.each([
    ".desktop",
    ".desktop--solid",
    ".desktop--gradient",
    ".window",
    ".window__titlebar",
    ".window__title",
    ".window__button--close",
    ".menubar",
    ".menubar__item",
    ".game",
    ".status",
    ".led",
    ".led__digit",
    ".smiley",
    ".field",
    ".cell",
    ".cell--closed",
  ])("styles %s", (selector) => {
    expect(css).toContain(selector);
  });

  it("scales the whole window through one variable, 1px by default (decision 30)", () => {
    expect(css).toMatch(/:root\s*{[^}]*--u:\s*1px/);
    expect(css).toMatch(
      /@media[^{]*min-resolution:\s*2dppx[^{]*{\s*:root\s*{[^}]*--u:\s*2px/,
    );
  });

  it("sizes the cell as 16 units", () => {
    expect(css).toMatch(/\.cell\s*{[^}]*width:\s*calc\(16 \* var\(--u\)\)/);
    expect(css).toMatch(/\.cell\s*{[^}]*height:\s*calc\(16 \* var\(--u\)\)/);
  });

  it("uses no fixed pixel lengths outside the --u variable and media queries", () => {
    const declarations = css
      .split("\n")
      .filter((line) => /^\s+[a-z-]+:/.test(line))
      .filter((line) => !/^\s+--u:/.test(line));
    const fixed = declarations.filter((line) => /\d+px/.test(line));
    expect(fixed).toEqual([]);
  });
});
