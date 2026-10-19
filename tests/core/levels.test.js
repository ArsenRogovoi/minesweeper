import { describe, expect, it } from "vitest";
import { LEVELS, clampCustom } from "../../src/js/core/levels.js";

describe("LEVELS", () => {
  it("defines the three XP presets", () => {
    expect(LEVELS.beginner).toEqual({ width: 9, height: 9, mines: 10 });
    expect(LEVELS.intermediate).toEqual({ width: 16, height: 16, mines: 40 });
    expect(LEVELS.expert).toEqual({ width: 30, height: 16, mines: 99 });
  });
});

describe("clampCustom", () => {
  it("keeps valid values unchanged", () => {
    expect(clampCustom({ width: 12, height: 10, mines: 20 })).toEqual({
      width: 12,
      height: 10,
      mines: 20,
    });
  });

  it("accepts the exact limits", () => {
    expect(clampCustom({ width: 9, height: 9, mines: 10 })).toEqual({
      width: 9,
      height: 9,
      mines: 10,
    });
    expect(clampCustom({ width: 30, height: 24, mines: 29 * 23 })).toEqual({
      width: 30,
      height: 24,
      mines: 29 * 23,
    });
  });

  it("raises too small width and height to 9", () => {
    expect(clampCustom({ width: 1, height: 0, mines: 10 })).toMatchObject({
      width: 9,
      height: 9,
    });
  });

  it("lowers too large width to 30 and height to 24", () => {
    expect(clampCustom({ width: 100, height: 100, mines: 10 })).toMatchObject({
      width: 30,
      height: 24,
    });
  });

  it("raises too few mines to 10", () => {
    expect(clampCustom({ width: 9, height: 9, mines: 0 }).mines).toBe(10);
    expect(clampCustom({ width: 9, height: 9, mines: -5 }).mines).toBe(10);
  });

  it("limits mines to (height - 1) * (width - 1)", () => {
    expect(clampCustom({ width: 9, height: 9, mines: 500 }).mines).toBe(64);
    expect(clampCustom({ width: 10, height: 12, mines: 500 }).mines).toBe(
      9 * 11,
    );
  });

  it("clamps mines against the already clamped size", () => {
    // 100 x 100 becomes 30 x 24, so the mine limit is 29 * 23 = 667
    expect(clampCustom({ width: 100, height: 100, mines: 5000 })).toEqual({
      width: 30,
      height: 24,
      mines: 667,
    });
  });

  it("truncates fractional values", () => {
    expect(clampCustom({ width: 12.9, height: 10.2, mines: 15.7 })).toEqual({
      width: 12,
      height: 10,
      mines: 15,
    });
  });

  it("accepts numeric strings, as they come from form inputs", () => {
    expect(clampCustom({ width: "12", height: "10", mines: "15" })).toEqual({
      width: 12,
      height: 10,
      mines: 15,
    });
  });

  it("treats non-numeric input as the lower limit", () => {
    expect(
      clampCustom({ width: "abc", height: undefined, mines: NaN }),
    ).toEqual({
      width: 9,
      height: 9,
      mines: 10,
    });
  });
});
