import { describe, expect, it } from "vitest";
import en from "../../src/js/i18n/en.js";
import ru from "../../src/js/i18n/ru.js";

describe("dictionaries", () => {
  it("have exactly the same keys in Russian and English", () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
  });

  it.each([
    ["ru", ru],
    ["en", en],
  ])("%s has only non-empty strings", (_name, dictionary) => {
    for (const [key, value] of Object.entries(dictionary)) {
      expect(typeof value, key).toBe("string");
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("names the window like XP does", () => {
    expect(ru["window.title"]).toBe("Сапёр");
    expect(en["window.title"]).toBe("Minesweeper");
  });

  it("contains the texts required for the menu bar, Game menu and Custom dialog", () => {
    const required = [
      "window.title",
      "menu.game",
      "menu.help",
      "game.new",
      "game.beginner",
      "game.intermediate",
      "game.expert",
      "game.custom",
      "game.marks",
      "game.language",
      "game.background",
      "background.solid",
      "background.gradient",
      "language.ru",
      "language.en",
      "dialog.custom.title",
      "dialog.custom.height",
      "dialog.custom.width",
      "dialog.custom.mines",
      "dialog.ok",
      "dialog.cancel",
    ];
    for (const key of required) {
      expect(ru, key).toHaveProperty([key]);
      expect(en, key).toHaveProperty([key]);
    }
  });
});
