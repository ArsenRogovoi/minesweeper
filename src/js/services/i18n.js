import { createEmitter } from "../core/emitter.js";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./languages.js";

/**
 * Picks the UI language from the browser language (`navigator.language`):
 * Russian if it starts with "ru", otherwise English.
 * @param {unknown} browserLanguage
 * @returns {"ru"|"en"}
 */
export function detectLanguage(browserLanguage) {
  const isRussian =
    typeof browserLanguage === "string" &&
    browserLanguage.toLowerCase().split("-")[0] === "ru";
  return isRussian ? "ru" : "en";
}

/**
 * Translation service.
 * @param {{
 *   dictionaries: Record<string, Record<string, string>>,
 *   language?: string
 * }} options an unsupported or missing `language` becomes English
 * @returns {{
 *   t: (key: string) => string,
 *   getLanguage: () => string,
 *   setLanguage: (language: string) => void,
 *   subscribe: (listener: (event: {language: string}) => void) => () => void
 * }}
 */
export function createI18n({ dictionaries, language }) {
  const emitter = createEmitter();
  let current = LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

  return {
    /** Text for the key in the current language, else in English, else the key itself. */
    t(key) {
      return (
        dictionaries[current]?.[key] ??
        dictionaries[DEFAULT_LANGUAGE]?.[key] ??
        key
      );
    },

    getLanguage: () => current,

    /** Changes the language and tells the listeners; unknown languages are ignored. */
    setLanguage(next) {
      if (!LANGUAGES.includes(next) || next === current) {
        return;
      }
      current = next;
      emitter.emit({ language: current });
    },

    subscribe: emitter.subscribe,
  };
}
