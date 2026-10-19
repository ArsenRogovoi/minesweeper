import { beforeEach, describe, expect, it, vi } from "vitest";
import { openDialog } from "../../src/js/ui/dialog.js";

let onOk;
let onCancel;
let handle;

beforeEach(() => {
  document.body.innerHTML =
    '<div class="window" id="page"><button id="behind">x</button></div>';
  onOk = vi.fn();
  onCancel = vi.fn();
});

function open(options = {}) {
  const content = document.createElement("div");
  content.innerHTML = '<input id="field" /><p id="text">Some text</p>';
  handle = openDialog({
    document,
    title: "Title",
    closeLabel: "Close",
    content,
    buttons: [
      { label: "OK", primary: true, onClick: onOk },
      { label: "Cancel" },
    ],
    onCancel,
    ...options,
  });
  return handle;
}

const overlay = () => document.querySelector(".dialog-overlay");
const dialog = () => document.querySelector(".dialog");
const button = (label) =>
  [...document.querySelectorAll(".dialog__button")].find(
    (b) => b.textContent === label,
  );
const key = (name, target = document.body) => {
  const event = new KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

describe("dialog", () => {
  it("shows a modal window with the title, the content and the buttons", () => {
    open();
    expect(overlay()).not.toBeNull();
    expect(dialog().querySelector(".window__title").textContent).toBe("Title");
    expect(dialog().querySelector("#text").textContent).toBe("Some text");
    expect(
      [...document.querySelectorAll(".dialog__button")].map(
        (b) => b.textContent,
      ),
    ).toEqual(["OK", "Cancel"]);
  });

  it("looks like a window (title bar and close button)", () => {
    open();
    expect(dialog().classList.contains("window")).toBe(true);
    const close = dialog().querySelector(".window__button--close");
    expect(close.tagName).toBe("BUTTON");
    expect(close.getAttribute("aria-label")).toBe("Close");
  });

  it("marks the page behind as inert while open and restores it afterwards", () => {
    open();
    expect(document.getElementById("page").hasAttribute("inert")).toBe(true);
    handle.close();
    expect(document.getElementById("page").hasAttribute("inert")).toBe(false);
  });

  it("does not make the dialog itself inert", () => {
    open();
    expect(dialog().hasAttribute("inert")).toBe(false);
  });

  it("runs the button action and closes", () => {
    open();
    button("OK").click();
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(overlay()).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("closes without an action on a button that has none", () => {
    open();
    button("Cancel").click();
    expect(overlay()).toBeNull();
  });

  it("stays open when the action returns false (validation failed)", () => {
    onOk.mockReturnValue(false);
    open();
    button("OK").click();
    expect(overlay()).not.toBeNull();
  });

  it("cancels with the close button", () => {
    open();
    dialog().querySelector(".window__button--close").click();
    expect(overlay()).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
  });

  it("cancels with Escape", () => {
    open();
    key("Escape");
    expect(overlay()).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("presses the primary button with Enter", () => {
    open();
    key("Enter", document.getElementById("field"));
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(overlay()).toBeNull();
  });

  it("leaves Enter to a focused button", () => {
    open();
    key("Enter", button("Cancel"));
    expect(onOk).not.toHaveBeenCalled();
    expect(overlay()).not.toBeNull();
  });

  it("ignores other keys", () => {
    open();
    key("a");
    expect(overlay()).not.toBeNull();
  });

  it("stays open when the dark area around it is pressed (it is modal)", () => {
    open();
    overlay().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    overlay().click();
    expect(overlay()).not.toBeNull();
  });

  it("puts the focus on the first input", () => {
    open();
    expect(document.activeElement).toBe(document.getElementById("field"));
  });

  it("puts the focus on the primary button when there is no input", () => {
    open({ content: document.createElement("p") });
    expect(document.activeElement).toBe(button("OK"));
  });

  it("replaces an open dialog when another one is opened", () => {
    open();
    open({ title: "Second" });
    expect(document.querySelectorAll(".dialog")).toHaveLength(1);
    expect(dialog().querySelector(".window__title").textContent).toBe("Second");
    expect(document.getElementById("page").hasAttribute("inert")).toBe(true);
  });

  it("ignores close() of a dialog that was already replaced or closed", () => {
    const first = open();
    open({ title: "Second" });
    first.close();
    expect(dialog().querySelector(".window__title").textContent).toBe("Second");
    expect(document.getElementById("page").hasAttribute("inert")).toBe(true);
    handle.close();
    handle.close();
    expect(overlay()).toBeNull();
    expect(document.getElementById("page").hasAttribute("inert")).toBe(false);
  });

  it("can be closed from code, without calling onCancel", () => {
    open();
    handle.close();
    expect(overlay()).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("stops listening to keys after it is closed", () => {
    open();
    handle.close();
    key("Escape");
    key("Enter");
    expect(onCancel).not.toHaveBeenCalled();
    expect(onOk).not.toHaveBeenCalled();
  });
});
