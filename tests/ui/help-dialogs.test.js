import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  openAboutDialog,
  openRulesDialog,
} from "../../src/js/ui/help-dialogs.js";
import { VERSION } from "../../src/js/version.js";
import { createI18n } from "../../src/js/services/i18n.js";
import en from "../../src/js/i18n/en.js";
import ru from "../../src/js/i18n/ru.js";

beforeEach(() => {
  document.body.innerHTML = '<div class="window" id="page"></div>';
});

const t = (language) => createI18n({ dictionaries: { ru, en }, language }).t;
const title = () =>
  document.querySelector(".dialog .window__title").textContent;
const text = () => document.querySelector(".dialog__body").textContent;

describe("version", () => {
  it("matches package.json", () => {
    const { version } = JSON.parse(readFileSync("package.json", "utf8"));
    expect(VERSION).toBe(version);
  });
});

describe("About dialog", () => {
  it("shows the name, the version and what the program is (English)", () => {
    openAboutDialog({ document, t: t("en") });
    expect(title()).toBe("About Minesweeper");
    expect(text()).toContain("Minesweeper");
    expect(text()).toContain(`Version ${VERSION}`);
    expect(text()).toContain("learning clone of Windows XP Minesweeper");
  });

  it("is translated to Russian", () => {
    openAboutDialog({ document, t: t("ru") });
    expect(title()).toBe("О программе «Сапёр»");
    expect(text()).toContain(`Версия ${VERSION}`);
    expect(text()).toContain("Учебный клон");
  });

  it("closes with OK", () => {
    openAboutDialog({ document, t: t("en") });
    const buttons = document.querySelectorAll(".dialog__button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toBe("OK");
    buttons[0].click();
    expect(document.querySelector(".dialog")).toBeNull();
  });

  it("has the program icon", () => {
    openAboutDialog({ document, t: t("en") });
    expect(document.querySelector(".dialog__icon")).not.toBeNull();
  });
});

describe("Rules dialog", () => {
  it.each([
    ["en", "Rules", ["Goal", "Mouse", "Keyboard", "Touch screen"]],
    ["ru", "Правила", ["Цель", "Мышь", "Клавиатура", "Сенсорный экран"]],
  ])(
    "has the rules and all the controls (%s)",
    (language, heading, sections) => {
      openRulesDialog({ document, t: t(language) });
      expect(title()).toBe(heading);
      const headings = [...document.querySelectorAll(".dialog__heading")].map(
        (h) => h.textContent,
      );
      expect(headings).toEqual(sections);
    },
  );

  it("explains every way to play (mouse, keyboard, touch) and the unprotected first click", () => {
    openRulesDialog({ document, t: t("en") });
    const body = text();
    expect(body).toContain("Left click");
    expect(body).toContain("Right click");
    expect(body).toContain("Arrow keys");
    expect(body).toContain("F2");
    expect(body).toContain("long press");
    expect(body).toContain("first click");
  });

  it("closes with OK", () => {
    openRulesDialog({ document, t: t("en") });
    document.querySelector(".dialog__button").click();
    expect(document.querySelector(".dialog")).toBeNull();
  });
});
