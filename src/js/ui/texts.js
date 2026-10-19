/**
 * Writes the texts of the page in the current language: <html lang>, the document and
 * window titles, and the label of the smiley button. Menus and dialogs draw their own texts.
 * @param {{document: Document, i18n: {t: (key: string) => string, getLanguage: () => string}}} options
 */
export function applyTexts({ document, i18n }) {
  const title = i18n.t("window.title");
  document.documentElement.lang = i18n.getLanguage();
  document.title = title;
  document.querySelector(".window__title").textContent = title;
  document
    .querySelector(".smiley")
    .setAttribute("aria-label", i18n.t("smiley.label"));
}

/**
 * Switches the desktop background class on <body> ("desktop--solid" / "desktop--gradient").
 * @param {Document} document
 * @param {"solid"|"gradient"} background
 */
export function applyBackground(document, background) {
  const { classList } = document.body;
  [...classList]
    .filter((name) => name.startsWith("desktop--"))
    .forEach((name) => classList.remove(name));
  classList.add(`desktop--${background}`);
}
