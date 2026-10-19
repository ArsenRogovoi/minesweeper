/**
 * Builds the menus (the model for createMenuBar) from the current settings,
 * in the current language.
 *
 * @param {{
 *   t: (key: string) => string,
 *   settings: import("../services/settings.js").Settings,
 *   actions: {
 *     newGame: () => void,
 *     setLevel: (level: "beginner"|"intermediate"|"expert") => void,
 *     toggleMarks: () => void,
 *     setLanguage: (language: "ru"|"en") => void,
 *     setBackground: (background: "solid"|"gradient") => void
 *   }
 * }} options
 * @returns {import("./menu.js").MenuModel[]}
 */
export function buildMenus({ t, settings, actions }) {
  const level = (id) => ({
    id,
    label: t(`game.${id}`),
    checked: settings.level === id,
    action: () => actions.setLevel(id),
  });

  return [
    {
      id: "game",
      label: t("menu.game"),
      items: [
        {
          id: "new",
          label: t("game.new"),
          shortcut: "F2",
          action: actions.newGame,
        },
        { separator: true },
        level("beginner"),
        level("intermediate"),
        level("expert"),
        { separator: true },
        {
          id: "marks",
          label: t("game.marks"),
          checked: settings.marks,
          action: actions.toggleMarks,
        },
        { separator: true },
        {
          id: "language",
          label: t("game.language"),
          items: ["ru", "en"].map((language) => ({
            id: language,
            label: t(`language.${language}`),
            checked: settings.language === language,
            action: () => actions.setLanguage(language),
          })),
        },
        {
          id: "background",
          label: t("game.background"),
          items: ["solid", "gradient"].map((background) => ({
            id: background,
            label: t(`background.${background}`),
            checked: settings.background === background,
            action: () => actions.setBackground(background),
          })),
        },
      ],
    },
  ];
}
