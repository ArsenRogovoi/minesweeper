import { VERSION } from "../version.js";
import { openDialog } from "./dialog.js";

const RULES_SECTIONS = ["goal", "mouse", "keyboard", "touch"];

function openInfoDialog({ document, t, title, content }) {
  return openDialog({
    document,
    title,
    closeLabel: t("dialog.close"),
    content,
    buttons: [{ label: t("dialog.ok"), primary: true }],
  });
}

function paragraph(document, className, text) {
  const node = document.createElement(
    className === "dialog__heading" ? "h3" : "p",
  );
  node.className = className;
  node.textContent = text;
  return node;
}

/**
 * The "About" dialog: program name, version and what the program is (decision 35).
 * @param {{document: Document, t: (key: string) => string}} options
 */
export function openAboutDialog({ document, t }) {
  const content = document.createElement("div");
  content.className = "dialog__about";
  const icon = document.createElement("span");
  icon.className = "dialog__icon";
  const text = document.createElement("div");
  const name = paragraph(document, "dialog__text", t("window.title"));
  name.classList.add("dialog__name");
  text.append(
    name,
    paragraph(document, "dialog__text", `${t("about.version")} ${VERSION}`),
    paragraph(document, "dialog__text", t("about.description")),
  );
  content.append(icon, text);
  return openInfoDialog({ document, t, title: t("about.title"), content });
}

/**
 * The "Rules" dialog: the rules and the controls (mouse, keyboard, touch).
 * @param {{document: Document, t: (key: string) => string}} options
 */
export function openRulesDialog({ document, t }) {
  const content = document.createElement("div");
  content.className = "dialog__rules";
  for (const section of RULES_SECTIONS) {
    content.append(
      paragraph(document, "dialog__heading", t(`rules.${section}.title`)),
      paragraph(document, "dialog__text", t(`rules.${section}.text`)),
    );
  }
  content.append(paragraph(document, "dialog__text", t("rules.firstClick")));
  return openInfoDialog({ document, t, title: t("rules.title"), content });
}
