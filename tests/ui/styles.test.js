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
    ".menubar__menu--open",
    ".menu",
    ".menu--sub",
    ".menu__item",
    ".menu__item--checked",
    ".menu__item--submenu",
    ".menu__item--disabled",
    ".menu__separator",
    ".dialog-overlay",
    ".dialog",
    ".dialog__body",
    ".dialog__field",
    ".dialog__buttons",
    ".dialog__heading",
    ".dialog__icon",
    ".dialog__button",
    ".dialog__button--primary",
    ".game",
    ".status",
    ".led",
    ".led__digit",
    ".smiley",
    ".field",
    ".cell",
    ".cell--closed",
    ".cell--pressed",
    ".cell--cursor",
  ])("styles %s", (selector) => {
    expect(css).toContain(selector);
  });

  it("scales the whole window through one variable, 1px by default (decision 30)", () => {
    expect(css).toMatch(/:root\s*{[^}]*--base-u:\s*1px/);
    expect(css).toMatch(
      /@media[^{]*min-resolution:\s*2dppx[^{]*{\s*:root\s*{[^}]*--base-u:\s*2px/,
    );
  });

  it("multiplies the unit by the --fit scale for narrow screens (decision 37)", () => {
    expect(css).toMatch(/:root\s*{[^}]*--fit:\s*1\s*;/);
    expect(css).toMatch(
      /:root\s*{[^}]*--u:\s*calc\(var\(--base-u\) \* var\(--fit\)\)/,
    );
  });

  it("keeps the finger on the field from scrolling, zooming or selecting (decision 14)", () => {
    expect(css).toMatch(/\.field\s*{[^}]*touch-action:\s*none/);
    expect(css).toMatch(/\.field\s*{[^}]*-webkit-touch-callout:\s*none/);
    expect(css).toMatch(/body\s*{[^}]*user-select:\s*none/);
    expect(css).toMatch(/body\s*{[^}]*touch-action:\s*manipulation/);
  });

  it("sizes the cell as 16 units", () => {
    expect(css).toMatch(/\.cell\s*{[^}]*width:\s*calc\(16 \* var\(--u\)\)/);
    expect(css).toMatch(/\.cell\s*{[^}]*height:\s*calc\(16 \* var\(--u\)\)/);
  });

  it("makes the LED box big enough for three whole digits (no squeezed digits)", () => {
    const units = (block, property) => {
      const match = block.match(
        new RegExp(
          `(?:^|[\\s;{])${property}:\\s*calc\\((\\d+) \\* var\\(--u\\)\\)`,
        ),
      );
      return match ? Number(match[1]) : 0;
    };
    const block = (selector) =>
      css.match(new RegExp(`${selector}\\s*{([^}]*)}`))[1];
    const led = block("\\.led");
    const digit = block("\\.led__digit");
    const border = units(led, "border");
    const padding = units(led, "padding");
    const inner = (size) => size - 2 * (border + padding);
    expect(inner(units(led, "width"))).toBeGreaterThanOrEqual(
      3 * units(digit, "width"),
    );
    expect(inner(units(led, "height"))).toBeGreaterThanOrEqual(
      units(digit, "height"),
    );
  });

  it("never shrinks a LED digit inside the flex row", () => {
    expect(css).toMatch(/\.led__digit\s*{[^}]*flex-shrink:\s*0/);
  });

  it("uses no fixed pixel lengths outside the --u variable and media queries", () => {
    const declarations = css
      .split("\n")
      .filter((line) => /^\s+[a-z-]+:/.test(line))
      .filter((line) => !/^\s+--[a-z-]+:/.test(line));
    const fixed = declarations.filter((line) => /\d+px/.test(line));
    expect(fixed).toEqual([]);
  });
});
