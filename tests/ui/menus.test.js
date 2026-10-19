import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMenus } from "../../src/js/ui/menus.js";
import { createI18n } from "../../src/js/services/i18n.js";
import en from "../../src/js/i18n/en.js";
import ru from "../../src/js/i18n/ru.js";

let actions;
let settings;

beforeEach(() => {
  actions = {
    newGame: vi.fn(),
    setLevel: vi.fn(),
    toggleMarks: vi.fn(),
    setLanguage: vi.fn(),
    setBackground: vi.fn(),
  };
  settings = {
    level: "beginner",
    custom: { width: 9, height: 9, mines: 10 },
    marks: true,
    language: "en",
    background: "solid",
  };
});

function build(language = "en") {
  const i18n = createI18n({ dictionaries: { ru, en }, language });
  return buildMenus({ t: i18n.t, settings, actions });
}

const gameMenu = (menus = build()) => menus.find((m) => m.id === "game");
const find = (items, id) => items.find((item) => item.id === id);
const labels = (items) => items.filter((i) => !i.separator).map((i) => i.label);

describe("Game menu", () => {
  it("is the first menu and is named in the current language", () => {
    expect(build()[0]).toMatchObject({ id: "game", label: "Game" });
    expect(build("ru")[0]).toMatchObject({ id: "game", label: "Игра" });
  });

  it("lists the items in XP order", () => {
    expect(labels(gameMenu().items)).toEqual([
      "New",
      "Beginner",
      "Intermediate",
      "Expert",
      "Marks (?)",
      "Language",
      "Background",
    ]);
  });

  it("separates the groups", () => {
    const kinds = gameMenu().items.map((i) => (i.separator ? "-" : i.id));
    expect(kinds).toEqual([
      "new",
      "-",
      "beginner",
      "intermediate",
      "expert",
      "-",
      "marks",
      "-",
      "language",
      "background",
    ]);
  });

  it("translates the items", () => {
    expect(labels(gameMenu(build("ru")).items)).toEqual([
      "Новая игра",
      "Новичок",
      "Любитель",
      "Профессионал",
      "Метки (?)",
      "Язык",
      "Фон",
    ]);
  });

  it("shows F2 next to New", () => {
    expect(find(gameMenu().items, "new").shortcut).toBe("F2");
  });

  it("starts a new game from New", () => {
    find(gameMenu().items, "new").action();
    expect(actions.newGame).toHaveBeenCalledTimes(1);
  });
});

describe("Game menu: levels", () => {
  it.each(["beginner", "intermediate", "expert"])(
    "checks only the current level (%s)",
    (level) => {
      settings.level = level;
      const items = gameMenu().items;
      for (const id of ["beginner", "intermediate", "expert"]) {
        expect(Boolean(find(items, id).checked), id).toBe(id === level);
      }
    },
  );

  it.each(["beginner", "intermediate", "expert"])("selects %s", (level) => {
    find(gameMenu().items, level).action();
    expect(actions.setLevel).toHaveBeenCalledWith(level);
  });
});

describe("Game menu: Marks", () => {
  it("is checked when Marks are on and unchecked when off", () => {
    expect(find(gameMenu().items, "marks").checked).toBe(true);
    settings.marks = false;
    expect(find(gameMenu().items, "marks").checked).toBe(false);
  });

  it("toggles Marks", () => {
    find(gameMenu().items, "marks").action();
    expect(actions.toggleMarks).toHaveBeenCalledTimes(1);
  });
});

describe("Game menu: Language and Background submenus", () => {
  it("offers both languages by their own names, whatever the UI language is", () => {
    for (const language of ["en", "ru"]) {
      const sub = find(gameMenu(build(language)).items, "language").items;
      expect(labels(sub)).toEqual(["Русский", "English"]);
    }
  });

  it("checks the current language and switches it", () => {
    settings.language = "ru";
    const sub = find(gameMenu().items, "language").items;
    expect(Boolean(find(sub, "ru").checked)).toBe(true);
    expect(Boolean(find(sub, "en").checked)).toBe(false);
    find(sub, "en").action();
    expect(actions.setLanguage).toHaveBeenCalledWith("en");
    find(sub, "ru").action();
    expect(actions.setLanguage).toHaveBeenCalledWith("ru");
  });

  it("offers the two backgrounds, translated", () => {
    expect(labels(find(gameMenu().items, "background").items)).toEqual([
      "Solid",
      "Gradient",
    ]);
    expect(
      labels(find(gameMenu(build("ru")).items, "background").items),
    ).toEqual(["Однотонный", "Градиент"]);
  });

  it("checks the current background and switches it", () => {
    const sub = find(gameMenu().items, "background").items;
    expect(find(sub, "solid").checked).toBe(true);
    expect(Boolean(find(sub, "gradient").checked)).toBe(false);
    find(sub, "gradient").action();
    expect(actions.setBackground).toHaveBeenCalledWith("gradient");
    find(sub, "solid").action();
    expect(actions.setBackground).toHaveBeenCalledWith("solid");
  });
});
