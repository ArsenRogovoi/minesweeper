import { beforeEach, describe, expect, it, vi } from "vitest";
import { openCustomDialog } from "../../src/js/ui/custom-dialog.js";
import { createI18n } from "../../src/js/services/i18n.js";
import en from "../../src/js/i18n/en.js";
import ru from "../../src/js/i18n/ru.js";

let onSubmit;

beforeEach(() => {
  document.body.innerHTML = '<div class="window" id="page"></div>';
  onSubmit = vi.fn();
});

function open(language = "en", current = { width: 12, height: 10, mines: 20 }) {
  const i18n = createI18n({ dictionaries: { ru, en }, language });
  return openCustomDialog({ document, t: i18n.t, current, onSubmit });
}

const input = (name) => document.querySelector(`input[name="${name}"]`);
const ok = () => document.querySelector(".dialog__button--primary");
const type = (name, value) => {
  input(name).value = value;
};

describe("custom field dialog", () => {
  it("has Height, Width and Mines fields in this order, filled with the current values", () => {
    open();
    const inputs = [...document.querySelectorAll(".dialog input")];
    expect(inputs.map((i) => i.name)).toEqual(["height", "width", "mines"]);
    expect(inputs.map((i) => i.value)).toEqual(["10", "12", "20"]);
  });

  it("labels the fields in English and Russian", () => {
    open("en");
    const text = (name) =>
      document.querySelector(`label[for="${input(name).id}"]`).textContent;
    expect([text("height"), text("width"), text("mines")]).toEqual([
      "Height:",
      "Width:",
      "Mines:",
    ]);
    open("ru");
    expect([text("height"), text("width"), text("mines")]).toEqual([
      "Высота:",
      "Ширина:",
      "Число мин:",
    ]);
  });

  it("has a title and OK / Cancel buttons in the current language", () => {
    open("ru");
    expect(document.querySelector(".window__title").textContent).toBe(
      "Особое поле",
    );
    expect(
      [...document.querySelectorAll(".dialog__button")].map(
        (b) => b.textContent,
      ),
    ).toEqual(["OK", "Отмена"]);
  });

  it("focuses the first field", () => {
    open();
    expect(document.activeElement).toBe(input("height"));
  });

  it("submits the values and closes on OK", () => {
    open();
    type("height", "15");
    type("width", "20");
    type("mines", "50");
    ok().click();
    expect(onSubmit).toHaveBeenCalledWith({ width: 20, height: 15, mines: 50 });
    expect(document.querySelector(".dialog")).toBeNull();
  });

  it("submits with Enter", () => {
    open();
    input("mines").dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(onSubmit).toHaveBeenCalledWith({ width: 12, height: 10, mines: 20 });
  });

  it("clamps out-of-range values to the XP limits", () => {
    open();
    type("height", "100");
    type("width", "2");
    type("mines", "9999");
    ok().click();
    // height 24, width 9, mines at most (24 - 1) * (9 - 1) = 184
    expect(onSubmit).toHaveBeenCalledWith({ width: 9, height: 24, mines: 184 });
  });

  it("raises too few mines to 10", () => {
    open();
    type("mines", "1");
    ok().click();
    expect(onSubmit.mock.calls[0][0].mines).toBe(10);
  });

  it("treats non-numeric input as the lower limit", () => {
    open();
    type("height", "abc");
    type("width", "");
    type("mines", "-");
    ok().click();
    expect(onSubmit).toHaveBeenCalledWith({ width: 9, height: 9, mines: 10 });
  });

  it("does not submit on Cancel, the close button or Escape", () => {
    open();
    document
      .querySelector(".dialog__button:not(.dialog__button--primary)")
      .click();
    expect(document.querySelector(".dialog")).toBeNull();
    open();
    document.querySelector(".window__button--close").click();
    open();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector(".dialog")).toBeNull();
  });

  it("accepts numbers with spaces around them", () => {
    open();
    type("height", " 12 ");
    ok().click();
    expect(onSubmit.mock.calls[0][0].height).toBe(12);
  });
});
