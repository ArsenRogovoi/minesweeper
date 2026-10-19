import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as sass from "sass";

const ASSETS_DIR = "assets";

/** file name -> expected size in px */
const EXPECTED = {
  "mine.svg": [16, 16],
  "flag.svg": [16, 16],
  "question.svg": [16, 16],
  "mine-crossed.svg": [16, 16],
  "smiley-normal.svg": [24, 24],
  "smiley-surprised.svg": [24, 24],
  "smiley-dead.svg": [24, 24],
  "smiley-won.svg": [24, 24],
  ...Object.fromEntries(
    [..."0123456789"].map((d) => [`led-${d}.svg`, [13, 23]]),
  ),
  "led-minus.svg": [13, 23],
  "window-minimize.svg": [21, 21],
  "window-maximize.svg": [21, 21],
  "window-close.svg": [21, 21],
  "icon.svg": [16, 16],
};

const read = (name) => readFileSync(path.join(ASSETS_DIR, name), "utf8");
const parse = (name) =>
  new DOMParser().parseFromString(read(name), "image/svg+xml");

describe("SVG assets", () => {
  it("contain exactly the expected files", () => {
    const files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".svg"));
    expect(files.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  describe.each(Object.entries(EXPECTED))("%s", (name, [width, height]) => {
    it("is well-formed SVG with the expected size and viewBox", () => {
      const doc = parse(name);
      expect(doc.querySelector("parsererror")).toBeNull();
      const svg = doc.documentElement;
      expect(svg.tagName).toBe("svg");
      expect(svg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
      expect(svg.getAttribute("width")).toBe(String(width));
      expect(svg.getAttribute("height")).toBe(String(height));
      expect(svg.getAttribute("viewBox")).toBe(`0 0 ${width} ${height}`);
    });

    it("is self-contained: no scripts, images, fonts or external references", () => {
      const source = read(name);
      expect(source).not.toMatch(/<script|<image|<foreignObject|<text|<style/i);
      expect(source).not.toMatch(
        /href=|url\(|@import|https?:\/\/(?!www\.w3\.org)/i,
      );
    });
  });

  it("draw every smiley differently", () => {
    const faces = ["normal", "surprised", "dead", "won"].map((n) =>
      read(`smiley-${n}.svg`),
    );
    expect(new Set(faces).size).toBe(4);
  });

  it("draw every LED digit differently", () => {
    const digits = [..."0123456789", "minus"].map((d) => read(`led-${d}.svg`));
    expect(new Set(digits).size).toBe(11);
  });

  it("light the right number of LED segments (7-segment display)", () => {
    const segments = {
      0: 6,
      1: 2,
      2: 5,
      3: 5,
      4: 4,
      5: 5,
      6: 6,
      7: 3,
      8: 7,
      9: 6,
    };
    for (const [digit, count] of Object.entries(segments)) {
      const polygons = parse(`led-${digit}.svg`).querySelectorAll("polygon");
      expect(polygons, `digit ${digit}`).toHaveLength(count);
    }
    expect(parse("led-minus.svg").querySelectorAll("polygon")).toHaveLength(1);
  });
});

describe("assets in the stylesheet", () => {
  let css;

  beforeAll(() => {
    css = sass.compile("src/scss/main.scss").css;
  });

  const referenced = () =>
    [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]);

  it("points every url() to an existing asset (CSS is served from css/)", () => {
    for (const url of referenced()) {
      const file = path.normalize(path.join("css", url));
      expect(existsSync(file), url).toBe(true);
    }
  });

  it("uses every asset at least once", () => {
    const used = new Set(referenced().map((url) => path.basename(url)));
    expect([...used].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each([
    ".cell--open",
    ".cell--flag",
    ".cell--question",
    ".cell--mine",
    ".cell--exploded",
    ".cell--wrong-flag",
    ".smiley--normal",
    ".smiley--surprised",
    ".smiley--dead",
    ".smiley--won",
    ".led__digit--minus",
    ...[..."0123456789"].map((d) => `.led__digit--${d}`),
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `.cell--n${n}`),
  ])("has the state class %s", (selector) => {
    expect(css).toContain(selector);
  });

  it("colours the numbers as in XP", () => {
    const colours = {
      1: "#0000ff",
      2: "#008000",
      3: "#ff0000",
      4: "#000080",
      5: "#800000",
      6: "#008080",
      7: "#000",
      8: "#808080",
    };
    for (const [n, colour] of Object.entries(colours)) {
      expect(css).toMatch(
        new RegExp(`\\.cell--n${n}\\s*{[^}]*color:\\s*${colour}\\b`),
      );
    }
  });
});
