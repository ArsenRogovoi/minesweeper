import { describe, expect, it } from "vitest";
import { createI18n, detectLanguage } from "../../src/js/services/i18n.js";

const dictionaries = {
  ru: { hello: "Привет", onlyRu: "Только русский" },
  en: { hello: "Hello", onlyEn: "English only" },
};

describe("detectLanguage", () => {
  it.each(["ru", "ru-RU", "RU", "ru-UA", "Ru-ru"])(
    "returns ru for %s",
    (value) => {
      expect(detectLanguage(value)).toBe("ru");
    },
  );

  it.each(["en", "en-US", "de-DE", "uk", "rus", "fr", "zh-CN"])(
    "returns en for %s",
    (value) => {
      expect(detectLanguage(value)).toBe("en");
    },
  );

  it.each([undefined, null, "", 42, {}])(
    "returns en when the browser language is missing or odd (%s)",
    (value) => {
      expect(detectLanguage(value)).toBe("en");
    },
  );
});

describe("createI18n", () => {
  it("translates keys into the current language", () => {
    expect(createI18n({ dictionaries, language: "ru" }).t("hello")).toBe(
      "Привет",
    );
    expect(createI18n({ dictionaries, language: "en" }).t("hello")).toBe(
      "Hello",
    );
  });

  it("starts in English when no language is given", () => {
    const i18n = createI18n({ dictionaries });
    expect(i18n.getLanguage()).toBe("en");
    expect(i18n.t("hello")).toBe("Hello");
  });

  it("starts in English when the language is not supported", () => {
    const i18n = createI18n({ dictionaries, language: "de" });
    expect(i18n.getLanguage()).toBe("en");
  });

  it("falls back to English for a key missing in the current language", () => {
    const i18n = createI18n({ dictionaries, language: "ru" });
    expect(i18n.t("onlyEn")).toBe("English only");
  });

  it("returns the key itself when no dictionary has it", () => {
    const i18n = createI18n({ dictionaries, language: "ru" });
    expect(i18n.t("missing.key")).toBe("missing.key");
  });

  it("switches language and notifies listeners", () => {
    const i18n = createI18n({ dictionaries, language: "en" });
    const events = [];
    i18n.subscribe((event) => events.push(event));
    i18n.setLanguage("ru");
    expect(i18n.getLanguage()).toBe("ru");
    expect(i18n.t("hello")).toBe("Привет");
    expect(events).toEqual([{ language: "ru" }]);
  });

  it("does not notify when the language stays the same", () => {
    const i18n = createI18n({ dictionaries, language: "en" });
    const events = [];
    i18n.subscribe((event) => events.push(event));
    i18n.setLanguage("en");
    expect(events).toEqual([]);
  });

  it("ignores an unsupported language", () => {
    const i18n = createI18n({ dictionaries, language: "en" });
    const events = [];
    i18n.subscribe((event) => events.push(event));
    i18n.setLanguage("de");
    expect(i18n.getLanguage()).toBe("en");
    expect(events).toEqual([]);
  });

  it("stops notifying a listener after it unsubscribes", () => {
    const i18n = createI18n({ dictionaries, language: "en" });
    const events = [];
    const unsubscribe = i18n.subscribe((event) => events.push(event));
    unsubscribe();
    i18n.setLanguage("ru");
    expect(events).toEqual([]);
  });
});
