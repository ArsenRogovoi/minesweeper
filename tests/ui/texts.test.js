import { beforeEach, describe, expect, it } from "vitest";
import { applyBackground, applyTexts } from "../../src/js/ui/texts.js";
import { createI18n } from "../../src/js/services/i18n.js";
import en from "../../src/js/i18n/en.js";
import ru from "../../src/js/i18n/ru.js";

beforeEach(() => {
  document.documentElement.lang = "en";
  document.title = "";
  document.body.className = "desktop desktop--solid";
  document.body.innerHTML =
    '<h1 class="window__title"></h1><button class="smiley" aria-label=""></button>';
});

describe("applyTexts", () => {
  it("writes the English texts", () => {
    const i18n = createI18n({ dictionaries: { ru, en }, language: "en" });
    applyTexts({ document, i18n });
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Minesweeper");
    expect(document.querySelector(".window__title").textContent).toBe(
      "Minesweeper",
    );
    expect(document.querySelector(".smiley").getAttribute("aria-label")).toBe(
      "New game",
    );
  });

  it("writes the Russian texts", () => {
    const i18n = createI18n({ dictionaries: { ru, en }, language: "ru" });
    applyTexts({ document, i18n });
    expect(document.documentElement.lang).toBe("ru");
    expect(document.title).toBe("Сапёр");
    expect(document.querySelector(".window__title").textContent).toBe("Сапёр");
    expect(document.querySelector(".smiley").getAttribute("aria-label")).toBe(
      "Новая игра",
    );
  });
});

describe("applyBackground", () => {
  it("switches the desktop class and keeps the others", () => {
    applyBackground(document, "gradient");
    expect([...document.body.classList].sort()).toEqual([
      "desktop",
      "desktop--gradient",
    ]);
    applyBackground(document, "solid");
    expect([...document.body.classList].sort()).toEqual([
      "desktop",
      "desktop--solid",
    ]);
  });
});
