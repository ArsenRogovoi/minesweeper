import { describe, expect, it } from "vitest";
import {
  SETTINGS_KEY,
  createSettingsStore,
  levelConfig,
  safeLocalStorage,
} from "../../src/js/services/settings.js";

/** In-memory stand-in for localStorage. */
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    data,
  };
}

const DEFAULTS = {
  level: "beginner",
  custom: { width: 9, height: 9, mines: 10 },
  marks: true,
  language: "en",
  background: "solid",
};

describe("settings store: load", () => {
  it("returns defaults when nothing is stored", () => {
    const store = createSettingsStore({ storage: memoryStorage() });
    expect(store.load()).toEqual(DEFAULTS);
  });

  it("uses the given default language", () => {
    const store = createSettingsStore({
      storage: memoryStorage(),
      defaultLanguage: "ru",
    });
    expect(store.load().language).toBe("ru");
  });

  it("returns a fresh object each time", () => {
    const store = createSettingsStore({ storage: memoryStorage() });
    store.load().custom.width = 30;
    expect(store.load().custom.width).toBe(9);
  });

  it("restores saved settings", () => {
    const saved = {
      level: "custom",
      custom: { width: 20, height: 12, mines: 33 },
      marks: false,
      language: "ru",
      background: "gradient",
    };
    const store = createSettingsStore({
      storage: memoryStorage({ [SETTINGS_KEY]: JSON.stringify(saved) }),
    });
    expect(store.load()).toEqual(saved);
  });

  it.each(["beginner", "intermediate", "expert", "custom"])(
    "accepts the level %s",
    (level) => {
      const store = createSettingsStore({
        storage: memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ level }) }),
      });
      expect(store.load().level).toBe(level);
    },
  );

  it.each([
    ["broken JSON", "{not json"],
    ["an empty string", ""],
    ["null", "null"],
    ["a number", "42"],
    ["a string", '"text"'],
    ["an array", "[1, 2]"],
  ])("falls back to defaults for %s", (_name, raw) => {
    const store = createSettingsStore({
      storage: memoryStorage({ [SETTINGS_KEY]: raw }),
    });
    expect(store.load()).toEqual(DEFAULTS);
  });

  it("replaces only the invalid fields with defaults", () => {
    const raw = JSON.stringify({
      level: "impossible",
      custom: "big",
      marks: "yes",
      language: "de",
      background: "wallpaper",
    });
    const store = createSettingsStore({
      storage: memoryStorage({ [SETTINGS_KEY]: raw }),
    });
    expect(store.load()).toEqual(DEFAULTS);
  });

  it("keeps valid fields when others are missing or invalid", () => {
    const raw = JSON.stringify({
      level: "expert",
      marks: 1,
      language: "ru",
      background: "gradient",
    });
    const store = createSettingsStore({
      storage: memoryStorage({ [SETTINGS_KEY]: raw }),
    });
    expect(store.load()).toEqual({
      ...DEFAULTS,
      level: "expert",
      language: "ru",
      background: "gradient",
    });
  });

  it.each(["solid", "gradient"])("accepts the background %s", (background) => {
    const store = createSettingsStore({
      storage: memoryStorage({
        [SETTINGS_KEY]: JSON.stringify({ background }),
      }),
    });
    expect(store.load().background).toBe(background);
  });

  it("clamps a stored custom field to the XP limits", () => {
    const raw = JSON.stringify({
      level: "custom",
      custom: { width: 100, height: 2, mines: 9999 },
    });
    const store = createSettingsStore({
      storage: memoryStorage({ [SETTINGS_KEY]: raw }),
    });
    expect(store.load().custom).toEqual({ width: 30, height: 9, mines: 232 });
  });

  it("uses the default custom field when its numbers are missing", () => {
    const raw = JSON.stringify({ custom: { width: "wide" } });
    const store = createSettingsStore({
      storage: memoryStorage({ [SETTINGS_KEY]: raw }),
    });
    expect(store.load().custom).toEqual(DEFAULTS.custom);
  });

  it("returns defaults when reading from storage throws", () => {
    const storage = {
      getItem() {
        throw new Error("denied");
      },
    };
    expect(createSettingsStore({ storage }).load()).toEqual(DEFAULTS);
  });

  it("returns defaults when there is no storage at all", () => {
    expect(createSettingsStore({ storage: null }).load()).toEqual(DEFAULTS);
    expect(createSettingsStore({}).load()).toEqual(DEFAULTS);
  });
});

describe("settings store: save", () => {
  it("saves settings so that load returns them", () => {
    const storage = memoryStorage();
    const store = createSettingsStore({ storage });
    const settings = {
      level: "custom",
      custom: { width: 15, height: 11, mines: 25 },
      marks: false,
      language: "ru",
      background: "gradient",
    };
    expect(store.save(settings)).toBe(true);
    expect(createSettingsStore({ storage }).load()).toEqual(settings);
  });

  it("stores valid JSON under a single key", () => {
    const storage = memoryStorage();
    createSettingsStore({ storage }).save(DEFAULTS);
    expect([...storage.data.keys()]).toEqual([SETTINGS_KEY]);
    expect(JSON.parse(storage.data.get(SETTINGS_KEY))).toEqual(DEFAULTS);
  });

  it("never writes invalid values", () => {
    const storage = memoryStorage();
    createSettingsStore({ storage }).save({
      level: "bogus",
      custom: { width: 500, height: 500, mines: 1 },
      marks: "maybe",
      language: "fr",
      background: "plaid",
    });
    expect(JSON.parse(storage.data.get(SETTINGS_KEY))).toEqual({
      ...DEFAULTS,
      custom: { width: 30, height: 24, mines: 10 },
    });
  });

  it("returns false and does not throw when writing fails", () => {
    const storage = {
      setItem() {
        throw new Error("quota exceeded");
      },
    };
    const store = createSettingsStore({ storage });
    expect(store.save(DEFAULTS)).toBe(false);
  });

  it("returns false when there is no storage", () => {
    expect(createSettingsStore({ storage: null }).save(DEFAULTS)).toBe(false);
  });
});

describe("levelConfig", () => {
  it("returns the preset for the three levels", () => {
    expect(levelConfig(DEFAULTS)).toEqual({ width: 9, height: 9, mines: 10 });
    expect(levelConfig({ ...DEFAULTS, level: "intermediate" })).toEqual({
      width: 16,
      height: 16,
      mines: 40,
    });
    expect(levelConfig({ ...DEFAULTS, level: "expert" })).toEqual({
      width: 30,
      height: 16,
      mines: 99,
    });
  });

  it("returns the custom field for the custom level", () => {
    const settings = {
      ...DEFAULTS,
      level: "custom",
      custom: { width: 12, height: 10, mines: 20 },
    };
    expect(levelConfig(settings)).toEqual({ width: 12, height: 10, mines: 20 });
  });
});

describe("safeLocalStorage", () => {
  it("returns the localStorage of the window", () => {
    const storage = memoryStorage();
    expect(safeLocalStorage({ localStorage: storage })).toBe(storage);
  });

  it("returns null when reading localStorage throws (blocked site data)", () => {
    const win = {
      get localStorage() {
        throw new Error("SecurityError");
      },
    };
    expect(safeLocalStorage(win)).toBeNull();
  });

  it("returns null when there is no localStorage", () => {
    expect(safeLocalStorage({})).toBeNull();
  });
});
