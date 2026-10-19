/** The dialog that is open now, if any: only one at a time. */
let active = null;

function element(document, tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/**
 * Opens a modal dialog drawn as a small XP window. The page behind it is made inert.
 * Escape and the close button cancel; Enter presses the primary button.
 *
 * @param {{
 *   document: Document,
 *   title: string,
 *   closeLabel: string,
 *   content: HTMLElement,
 *   buttons: {label: string, primary?: boolean, onClick?: () => (boolean|void)}[],
 *   onCancel?: () => void
 * }} options a button's `onClick` may return false to keep the dialog open
 * @returns {{close: () => void}} `close()` closes the dialog without calling `onCancel`
 */
export function openDialog({
  document,
  title,
  closeLabel,
  content,
  buttons,
  onCancel,
}) {
  active?.close();

  const overlay = element(document, "div", "dialog-overlay");
  const dialog = element(document, "div", "window dialog");
  const titleBar = element(document, "div", "window__titlebar");
  const closeButton = element(
    document,
    "button",
    "window__button window__button--close",
  );
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", closeLabel);
  titleBar.append(element(document, "h2", "window__title", title), closeButton);

  const buttonRow = element(document, "div", "dialog__buttons");
  let primary = null;
  const buttonElements = buttons.map((spec) => {
    const node = element(document, "button", "dialog__button", spec.label);
    node.type = "button";
    node.addEventListener("click", () => press(spec));
    if (spec.primary) {
      node.classList.add("dialog__button--primary");
      primary = { spec, node };
    }
    return node;
  });
  buttonRow.append(...buttonElements);

  const body = element(document, "div", "dialog__body");
  body.append(content, buttonRow);
  dialog.append(titleBar, body);
  overlay.append(dialog);

  const page = document.querySelector(".window:not(.dialog)");

  function press(spec) {
    if (spec.onClick?.() !== false) {
      close();
    }
  }

  function cancel() {
    close();
    onCancel?.();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      cancel();
    } else if (
      event.key === "Enter" &&
      primary &&
      event.target.tagName !== "BUTTON"
    ) {
      event.preventDefault();
      press(primary.spec);
    }
  }

  let closed = false;

  function close() {
    if (closed) {
      return; // already closed, or replaced by another dialog
    }
    closed = true;
    document.removeEventListener("keydown", onKeyDown);
    page?.removeAttribute("inert");
    overlay.remove();
    active = null;
  }

  closeButton.addEventListener("click", cancel);
  document.addEventListener("keydown", onKeyDown);
  page?.setAttribute("inert", "");
  document.body.append(overlay);
  (content.querySelector("input") ?? primary?.node ?? closeButton).focus();

  const handle = { close };
  active = handle;
  return handle;
}
