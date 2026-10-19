import { LEVELS, clampCustom } from "../core/levels.js";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./languages.js";

/** localStorage key under which all settings are stored as one JSON object. */
export const SETTINGS_KEY = "minesweeper.settings";

/** Desktop backgrounds: plain XP colour and a Bliss-like gradient. The first is the default. */
export const BACKGROUNDS = Object.freeze(["solid", "gradient"]);

const LEVEL_NAMES = [...Object.keys(LEVELS), "custom"];

/**
 * @typedef {{
 *   level: "beginner"|"intermediate"|"expert"|"custom",
 *   custom: {width: number, height: number, mines: number},
 *   marks: boolean,
 *   language: "ru"|"en",
 *   background: "solid"|"gradient"
 * }} Settings
 */

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Turns anything into valid settings; each invalid or missing field gets its default. */
function normalize(raw, defaultLanguage) {
  const source = isObject(raw) ? raw : {};
  const custom = isObject(source.custom) ? source.custom : {};
  return {
    level: LEVEL_NAMES.includes(source.level) ? source.level : "beginner",
    custom: clampCustom(custom),
    marks: typeof source.marks === "boolean" ? source.marks : true,
    language: LANGUAGES.includes(source.language)
      ? source.language
      : defaultLanguage,
    background: BACKGROUNDS.includes(source.background)
      ? source.background
      : BACKGROUNDS[0],
  };
}

/**
 * Stores the settings (level, custom field, Marks, language, background) in a localStorage-like
 * storage. Missing, broken or unavailable storage never breaks the game: the
 * defaults are used instead.
 *
 * @param {{
 *   storage?: {getItem: Function, setItem: Function} | null,
 *   defaultLanguage?: string
 * }} options `defaultLanguage` is used when no language is saved (see detectLanguage)
 * @returns {{load: () => Settings, save: (settings: Settings) => boolean}}
 */
export function createSettingsStore({ storage, defaultLanguage } = {}) {
  const fallbackLanguage = LANGUAGES.includes(defaultLanguage)
    ? defaultLanguage
    : DEFAULT_LANGUAGE;

  return {
    /** Reads the settings; always returns valid ones. */
    load() {
      let raw = null;
      try {
        raw = JSON.parse(storage.getItem(SETTINGS_KEY));
      } catch {
        // no storage, access denied or broken JSON: use the defaults
      }
      return normalize(raw, fallbackLanguage);
    },

    /** Writes the settings; returns false if the storage is missing or refuses. */
    save(settings) {
      try {
        storage.setItem(
          SETTINGS_KEY,
          JSON.stringify(normalize(settings, fallbackLanguage)),
        );
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Field size for the level in the settings: a preset, or the custom field.
 * @param {Settings} settings
 * @returns {{width: number, height: number, mines: number}}
 */
export function levelConfig({ level, custom }) {
  return level === "custom" ? custom : LEVELS[level];
}

/**
 * The window's localStorage, or null when the browser refuses access
 * (blocked site data throws on reading `localStorage`).
 * @param {{localStorage?: Storage}} win
 * @returns {Storage|null}
 */
export function safeLocalStorage(win) {
  try {
    return win.localStorage ?? null;
  } catch {
    return null;
  }
}
