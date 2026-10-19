import { clampCustom } from "../core/levels.js";
import { openDialog } from "./dialog.js";

const FIELDS = [
  { name: "height", label: "dialog.custom.height" },
  { name: "width", label: "dialog.custom.width" },
  { name: "mines", label: "dialog.custom.mines" },
];

/**
 * The "Custom field" dialog: height, width and number of mines. On OK the values are
 * clamped to the XP limits (see clampCustom) and passed to `onSubmit`.
 *
 * @param {{
 *   document: Document,
 *   t: (key: string) => string,
 *   current: {width: number, height: number, mines: number},
 *   onSubmit: (config: {width: number, height: number, mines: number}) => void
 * }} options
 * @returns {{close: () => void}}
 */
export function openCustomDialog({ document, t, current, onSubmit }) {
  const content = document.createElement("div");
  content.className = "dialog__fields";
  for (const { name, label } of FIELDS) {
    const row = document.createElement("div");
    row.className = "dialog__field";
    const id = `custom-${name}`;
    const caption = document.createElement("label");
    caption.htmlFor = id;
    caption.textContent = t(label);
    const input = document.createElement("input");
    input.id = id;
    input.name = name;
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.value = String(current[name]);
    input.addEventListener("focus", () => input.select());
    row.append(caption, input);
    content.append(row);
  }

  const read = (name) => content.querySelector(`input[name="${name}"]`).value;

  return openDialog({
    document,
    title: t("dialog.custom.title"),
    closeLabel: t("dialog.close"),
    content,
    buttons: [
      {
        label: t("dialog.ok"),
        primary: true,
        onClick: () =>
          onSubmit(
            clampCustom({
              width: read("width"),
              height: read("height"),
              mines: read("mines"),
            }),
          ),
      },
      { label: t("dialog.cancel") },
    ],
  });
}
