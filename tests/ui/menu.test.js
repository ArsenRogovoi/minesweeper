import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMenuBar } from "../../src/js/ui/menu.js";

let bar;
let menuBar;
let state;
let actions;

/** The model is rebuilt on every call, like the real one is from the app state. */
function getMenus() {
  const menus = [
    {
      id: "game",
      label: state.gameLabel,
      items: [
        { id: "new", label: "New", shortcut: "F2", action: actions.newGame },
        { separator: true },
        {
          id: "beginner",
          label: "Beginner",
          checked: state.level === "beginner",
          action: actions.beginner,
        },
        {
          id: "expert",
          label: "Expert",
          checked: state.level === "expert",
          action: actions.expert,
        },
        {
          id: "locked",
          label: "Locked",
          disabled: true,
          action: actions.locked,
        },
        {
          id: "language",
          label: "Language",
          items: [
            { id: "ru", label: "Русский", checked: true, action: actions.ru },
            { id: "en", label: "English", action: actions.en },
          ],
        },
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [{ id: "about", label: "About", action: actions.about }],
    },
  ];
  return state.onlyGame ? menus.filter((m) => m.id === "game") : menus;
}

beforeEach(() => {
  document.body.innerHTML =
    '<nav class="menubar" id="bar"></nav><div id="outside"></div>';
  bar = document.getElementById("bar");
  state = { gameLabel: "Game", level: "beginner" };
  actions = {
    newGame: vi.fn(),
    beginner: vi.fn(),
    expert: vi.fn(() => {
      state.level = "expert";
    }),
    locked: vi.fn(),
    ru: vi.fn(),
    en: vi.fn(),
    about: vi.fn(),
  };
  menuBar = createMenuBar({ container: bar, document, getMenus });
  menuBar.render();
});

const title = (id) => bar.querySelector(`[data-menu="${id}"] > .menubar__item`);
const menu = (id) => bar.querySelector(`[data-menu="${id}"]`);
const isOpen = (id) => menu(id).classList.contains("menubar__menu--open");
const item = (menuId, itemId) =>
  menu(menuId).querySelector(`[data-item="${itemId}"]`);
const fire = (type, element, init = {}) =>
  element.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, ...init }),
  );
const pointerDown = (element) => fire("pointerdown", element);
const hover = (element) => fire("pointerover", element);

describe("menu bar: structure", () => {
  it("shows the menu titles in order", () => {
    const titles = [...bar.querySelectorAll(".menubar__item")].map(
      (el) => el.textContent,
    );
    expect(titles).toEqual(["Game", "Help"]);
  });

  it("starts with every menu closed", () => {
    expect(isOpen("game")).toBe(false);
    expect(isOpen("help")).toBe(false);
    expect(menuBar.isOpen()).toBe(false);
  });

  it("lists items with labels, shortcuts and separators", () => {
    const children = [...menu("game").querySelector(".menu").children];
    expect(children.map((el) => el.className.split(" ")[0])).toEqual([
      "menu__item",
      "menu__separator",
      "menu__item",
      "menu__item",
      "menu__item",
      "menu__item",
    ]);
    expect(item("game", "new").querySelector(".menu__label").textContent).toBe(
      "New",
    );
    expect(
      item("game", "new").querySelector(".menu__shortcut").textContent,
    ).toBe("F2");
  });

  it("marks checked and disabled items", () => {
    expect(
      item("game", "beginner").classList.contains("menu__item--checked"),
    ).toBe(true);
    expect(
      item("game", "expert").classList.contains("menu__item--checked"),
    ).toBe(false);
    expect(
      item("game", "locked").classList.contains("menu__item--disabled"),
    ).toBe(true);
  });

  it("builds submenus inside their parent item", () => {
    const parent = item("game", "language");
    expect(parent.classList.contains("menu__item--submenu")).toBe(true);
    const sub = parent.querySelector(".menu--sub");
    expect(
      [...sub.querySelectorAll(".menu__label")].map((e) => e.textContent),
    ).toEqual(["Русский", "English"]);
    expect(
      sub
        .querySelector('[data-item="ru"]')
        .classList.contains("menu__item--checked"),
    ).toBe(true);
  });
});

describe("menu bar: opening and closing", () => {
  it("opens a menu on click and closes it on a second click", () => {
    title("game").click();
    expect(isOpen("game")).toBe(true);
    expect(menuBar.isOpen()).toBe(true);
    title("game").click();
    expect(isOpen("game")).toBe(false);
  });

  it("switches to another menu on click", () => {
    title("game").click();
    title("help").click();
    expect(isOpen("game")).toBe(false);
    expect(isOpen("help")).toBe(true);
  });

  it("switches to another menu when the pointer moves over it while a menu is open", () => {
    title("game").click();
    hover(title("help"));
    expect(isOpen("help")).toBe(true);
    expect(isOpen("game")).toBe(false);
  });

  it("does not open anything on hover when no menu is open", () => {
    hover(title("help"));
    expect(menuBar.isOpen()).toBe(false);
  });

  it("closes on a press outside the menu bar", () => {
    title("game").click();
    pointerDown(document.getElementById("outside"));
    expect(menuBar.isOpen()).toBe(false);
  });

  it("stays open on a press inside the menu", () => {
    title("game").click();
    pointerDown(item("game", "beginner"));
    expect(isOpen("game")).toBe(true);
  });

  it("closes on Escape and ignores other keys", () => {
    title("game").click();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(isOpen("game")).toBe(true);
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(isOpen("game")).toBe(false);
  });

  it("can be closed from code", () => {
    title("game").click();
    menuBar.close();
    expect(menuBar.isOpen()).toBe(false);
  });
});

describe("menu bar: items", () => {
  it("runs the action once and closes the menu on click", () => {
    title("game").click();
    item("game", "new").click();
    expect(actions.newGame).toHaveBeenCalledTimes(1);
    expect(menuBar.isOpen()).toBe(false);
  });

  it("does not run actions of disabled items and keeps the menu open", () => {
    title("game").click();
    item("game", "locked").click();
    expect(actions.locked).not.toHaveBeenCalled();
    expect(isOpen("game")).toBe(true);
  });

  it("opens a submenu on hover and on click, without running an action", () => {
    title("game").click();
    const parent = item("game", "language");
    hover(parent);
    expect(parent.classList.contains("menu__item--open")).toBe(true);
    hover(item("game", "new"));
    expect(parent.classList.contains("menu__item--open")).toBe(false);
    parent.click();
    expect(parent.classList.contains("menu__item--open")).toBe(true);
    expect(isOpen("game")).toBe(true);
  });

  it("keeps the submenu open while the pointer is inside it", () => {
    title("game").click();
    const parent = item("game", "language");
    hover(parent);
    hover(item("game", "en"));
    expect(parent.classList.contains("menu__item--open")).toBe(true);
  });

  it("runs a submenu action once and closes everything", () => {
    title("game").click();
    item("game", "language").click();
    item("game", "en").click();
    expect(actions.en).toHaveBeenCalledTimes(1);
    expect(menuBar.isOpen()).toBe(false);
    expect(
      item("game", "language").classList.contains("menu__item--open"),
    ).toBe(false);
  });

  it("forgets the open submenu when the menu is closed and opened again", () => {
    title("game").click();
    item("game", "language").click();
    title("game").click();
    title("game").click();
    expect(
      item("game", "language").classList.contains("menu__item--open"),
    ).toBe(false);
  });

  it("runs actions from other menus too", () => {
    title("help").click();
    item("help", "about").click();
    expect(actions.about).toHaveBeenCalledTimes(1);
  });
});

describe("menu bar: render()", () => {
  it("shows the new state after an action changed it", () => {
    title("game").click();
    item("game", "expert").click();
    expect(
      item("game", "expert").classList.contains("menu__item--checked"),
    ).toBe(true);
    expect(
      item("game", "beginner").classList.contains("menu__item--checked"),
    ).toBe(false);
  });

  it("updates the texts when the model changes", () => {
    state.gameLabel = "Игра";
    menuBar.render();
    expect(title("game").textContent).toBe("Игра");
  });

  it("keeps an open menu open across render()", () => {
    title("game").click();
    menuBar.render();
    expect(isOpen("game")).toBe(true);
  });

  it("closes when the open menu is gone from the model", () => {
    title("help").click();
    state.onlyGame = true;
    menuBar.render();
    expect(bar.querySelectorAll(".menubar__menu--open")).toHaveLength(0);
    expect(menuBar.isOpen()).toBe(false);
  });
});

describe("menu bar: destroy", () => {
  it("removes its listeners and its content", () => {
    title("game").click();
    menuBar.destroy();
    expect(bar.children).toHaveLength(0);
    pointerDown(document.getElementById("outside"));
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(menuBar.isOpen()).toBe(true); // nothing reacted: the state was left as it was
  });
});
