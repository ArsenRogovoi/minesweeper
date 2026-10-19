import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startApp } from "../../src/js/ui/app.js";
import { createFakeScheduler, randomForMines } from "../core/helpers.js";

// Beginner board (9x9): a wall of mines in column 4 plus one mine in the corner,
// so opening the bottom-right corner floods only the right part of the field
const MINES = [0, 4, 13, 22, 31, 40, 49, 58, 67, 76];

let scheduler;
let app;

const PAGE = new DOMParser().parseFromString(
  readFileSync("index.html", "utf8"),
  "text/html",
);

/** Loads the page into the jsdom document and starts the app on it. */
function start(options = {}) {
  document.documentElement.lang = "en";
  document.body.className = PAGE.body.className;
  document.body.innerHTML = PAGE.body.innerHTML;
  scheduler = createFakeScheduler();
  return startApp({
    document,
    random: randomForMines(81, MINES),
    scheduler,
    ...options,
  });
}

beforeEach(() => {
  app = start();
});

const cell = (index) => document.querySelector(`.cell[data-index="${index}"]`);
const digits = (selector) =>
  [...document.querySelectorAll(`${selector} .led__digit`)]
    .map((d) => d.className.replace("led__digit led__digit--", ""))
    .join("");
const smiley = () => document.querySelector(".smiley").className;

describe("startApp", () => {
  it("draws a Beginner field of 81 closed cells", () => {
    expect(document.querySelectorAll(".cell")).toHaveLength(81);
    expect(document.querySelectorAll(".cell--closed")).toHaveLength(81);
    expect(
      document.querySelector(".field").style.getPropertyValue("--columns"),
    ).toBe("9");
  });

  it("shows 010 mines, a zero timer and the normal smiley", () => {
    expect(digits(".led--mines")).toBe("010");
    expect(digits(".led--timer")).toBe("000");
    expect(smiley()).toBe("smiley smiley--normal");
  });

  it("returns the game and the timer", () => {
    expect(app.game.getSnapshot().state).toBe("ready");
    expect(app.timer.getSeconds()).toBe(0);
  });

  it("redraws the field when the game changes", () => {
    app.game.open(80);
    expect(cell(80).classList.contains("cell--open")).toBe(true);
    expect(document.querySelectorAll(".cell--open").length).toBeGreaterThan(1);
  });

  it("updates the mine counter when flags are placed", () => {
    app.game.toggleMark(40);
    expect(cell(40).classList.contains("cell--flag")).toBe(true);
    expect(digits(".led--mines")).toBe("009");
  });

  it("starts the timer at the first open and redraws it every second", () => {
    app.game.open(80);
    expect(digits(".led--timer")).toBe("001");
    scheduler.advance(2000);
    expect(digits(".led--timer")).toBe("003");
  });

  it("shows the dead smiley, the exploded mine and a stopped timer after a loss", () => {
    app.game.open(80);
    scheduler.advance(1000);
    app.game.open(0);
    expect(smiley()).toBe("smiley smiley--dead");
    expect(cell(0).classList.contains("cell--exploded")).toBe(true);
    scheduler.advance(5000);
    expect(digits(".led--timer")).toBe("002");
  });

  it("resets the field, the counters and the smiley on a new game", () => {
    app.game.toggleMark(40);
    app.game.open(80);
    scheduler.advance(3000);
    app.game.open(0);
    app.game.newGame();
    expect(document.querySelectorAll(".cell--closed")).toHaveLength(81);
    expect(digits(".led--mines")).toBe("010");
    expect(digits(".led--timer")).toBe("000");
    expect(smiley()).toBe("smiley smiley--normal");
  });

  describe("mouse", () => {
    const fire = (type, element, init) =>
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerType: "mouse",
          button: 0,
          ...init,
        }),
      );

    it("shows a pressed cell and the surprised smiley while the button is held", () => {
      fire("pointerdown", cell(80), { buttons: 1 });
      expect(cell(80).classList.contains("cell--pressed")).toBe(true);
      expect(smiley()).toBe("smiley smiley--surprised");
    });

    it("opens the cell on release and goes back to the normal smiley", () => {
      fire("pointerdown", cell(80), { buttons: 1 });
      fire("pointerup", cell(80), { buttons: 0 });
      expect(cell(80).classList.contains("cell--open")).toBe(true);
      expect(cell(80).classList.contains("cell--pressed")).toBe(false);
      expect(smiley()).toBe("smiley smiley--normal");
    });

    it("shows the dead smiley after a mine is opened with the mouse", () => {
      fire("pointerdown", cell(0), { buttons: 1 });
      fire("pointerup", cell(0), { buttons: 0 });
      expect(smiley()).toBe("smiley smiley--dead");
    });
  });

  describe("new game", () => {
    it("starts when the smiley is clicked, even after a loss", () => {
      app.game.open(0);
      expect(smiley()).toBe("smiley smiley--dead");
      document.querySelector(".smiley").click();
      expect(smiley()).toBe("smiley smiley--normal");
      expect(document.querySelectorAll(".cell--closed")).toHaveLength(81);
    });

    it("starts when F2 is pressed", () => {
      app.game.open(80);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "F2" }));
      expect(document.querySelectorAll(".cell--closed")).toHaveLength(81);
      expect(digits(".led--timer")).toBe("000");
    });
  });

  describe("keyboard", () => {
    const field = () => document.querySelector(".field");
    const press = (code, key = code) =>
      field().dispatchEvent(
        new KeyboardEvent("keydown", {
          code,
          key,
          bubbles: true,
          cancelable: true,
        }),
      );

    it("shows the cursor on the first cell", () => {
      expect(cell(0).classList.contains("cell--cursor")).toBe(true);
    });

    it("moves the cursor with the arrow keys", () => {
      press("ArrowRight");
      press("ArrowDown");
      expect(cell(0).classList.contains("cell--cursor")).toBe(false);
      expect(cell(10).classList.contains("cell--cursor")).toBe(true);
    });

    it("opens the cell under the cursor with Space and flags it with F", () => {
      for (let i = 0; i < 8; i++) press("ArrowDown");
      for (let i = 0; i < 8; i++) press("ArrowRight");
      press("Space", " ");
      expect(cell(80).classList.contains("cell--open")).toBe(true);
      press("ArrowLeft");
      press("KeyF", "f");
      expect(digits(".led--mines")).toBe("010"); // cell 79 is already open: no flag
    });

    it("puts the cursor back on the first cell after a new game", () => {
      press("ArrowRight");
      app.game.newGame();
      expect(cell(0).classList.contains("cell--cursor")).toBe(true);
      expect(cell(1).classList.contains("cell--cursor")).toBe(false);
    });
  });

  describe("settings and language", () => {
    const storageWith = (settings) => ({
      getItem: () => JSON.stringify(settings),
      setItem: () => {},
    });
    const noRandomNeeded = () => 0.5;

    it("starts with the saved level", () => {
      app = start({
        storage: storageWith({ level: "expert" }),
        random: noRandomNeeded,
      });
      expect(document.querySelectorAll(".cell")).toHaveLength(480);
      expect(digits(".led--mines")).toBe("099");
    });

    it("starts with the saved custom field", () => {
      app = start({
        storage: storageWith({
          level: "custom",
          custom: { width: 12, height: 10, mines: 20 },
        }),
        random: noRandomNeeded,
      });
      expect(document.querySelectorAll(".cell")).toHaveLength(120);
      expect(digits(".led--mines")).toBe("020");
    });

    it("starts with the saved Marks setting", () => {
      app = start({ storage: storageWith({ marks: false }) });
      app.game.toggleMark(40);
      app.game.toggleMark(40);
      expect(cell(40).classList.contains("cell--question")).toBe(false);
      expect(app.game.getSnapshot().marks).toBe(false);
    });

    it("shows the texts in the saved language", () => {
      app = start({ storage: storageWith({ language: "ru" }) });
      expect(document.title).toBe("Сапёр");
      expect(document.documentElement.lang).toBe("ru");
    });

    it("picks the language from the browser when nothing is saved", () => {
      app = start({ browserLanguage: "ru-RU" });
      expect(document.title).toBe("Сапёр");
      app = start({ browserLanguage: "de-DE" });
      expect(document.title).toBe("Minesweeper");
    });

    it("applies the saved background", () => {
      app = start({ storage: storageWith({ background: "gradient" }) });
      expect(document.body.classList.contains("desktop--gradient")).toBe(true);
      expect(document.body.classList.contains("desktop--solid")).toBe(false);
    });

    it("works without any storage", () => {
      app = start({ storage: null });
      expect(document.querySelectorAll(".cell")).toHaveLength(81);
      expect(document.title).toBe("Minesweeper");
    });

    it("changes the texts when the language changes", () => {
      app.i18n.setLanguage("ru");
      expect(document.title).toBe("Сапёр");
      expect(document.querySelector(".window__title").textContent).toBe(
        "Сапёр",
      );
    });
  });

  describe("Game menu", () => {
    /** localStorage stand-in that remembers what the app saves. */
    function memoryStorage(initial) {
      const data = { value: initial ? JSON.stringify(initial) : null };
      return {
        getItem: () => data.value,
        setItem: (_key, value) => {
          data.value = value;
        },
        saved: () => JSON.parse(data.value),
      };
    }
    const noRandomNeeded = () => 0.5;
    const title = (menu) =>
      document.querySelector(`[data-menu="${menu}"] > .menubar__item`);
    const item = (id) =>
      document.querySelector(`.menu__item[data-item="${id}"]`);
    const choose = (menu, ...ids) => {
      title(menu).click();
      ids.forEach((id) => item(id).click());
    };
    let storage;

    beforeEach(() => {
      storage = memoryStorage();
      app = start({ storage, random: noRandomNeeded });
    });

    it("shows the Game menu title in the menu bar", () => {
      expect(title("game").textContent).toBe("Game");
    });

    it("starts a new game from New", () => {
      app.game.open(0);
      choose("game", "new");
      expect(app.game.getSnapshot().state).toBe("ready");
    });

    it.each([
      ["intermediate", 256, "040"],
      ["expert", 480, "099"],
      ["beginner", 81, "010"],
    ])(
      "switches to %s: new field, new counter, saved",
      (level, cells, mines) => {
        choose("game", level);
        expect(document.querySelectorAll(".cell")).toHaveLength(cells);
        expect(digits(".led--mines")).toBe(mines);
        expect(storage.saved().level).toBe(level);
      },
    );

    it("checks the current level in the menu", () => {
      choose("game", "expert");
      title("game").click();
      expect(item("expert").classList.contains("menu__item--checked")).toBe(
        true,
      );
      expect(item("beginner").classList.contains("menu__item--checked")).toBe(
        false,
      );
    });

    it("restarts the game when the same level is chosen again", () => {
      app.game.open(0);
      choose("game", "beginner");
      expect(app.game.getSnapshot().state).toBe("ready");
    });

    it("turns Marks off and on, and saves it", () => {
      choose("game", "marks");
      expect(app.game.getSnapshot().marks).toBe(false);
      expect(storage.saved().marks).toBe(false);
      choose("game", "marks");
      expect(app.game.getSnapshot().marks).toBe(true);
      expect(storage.saved().marks).toBe(true);
    });

    it("clears question marks when Marks are turned off", () => {
      app.game.toggleMark(40);
      app.game.toggleMark(40);
      expect(cell(40).classList.contains("cell--question")).toBe(true);
      choose("game", "marks");
      expect(cell(40).classList.contains("cell--question")).toBe(false);
    });

    it("switches the language: page texts, menu texts, saved", () => {
      choose("game", "language", "ru");
      expect(document.title).toBe("Сапёр");
      expect(title("game").textContent).toBe("Игра");
      expect(storage.saved().language).toBe("ru");
    });

    it("keeps the game running when the language changes", () => {
      app.game.open(80);
      choose("game", "language", "ru");
      expect(app.game.getSnapshot().state).toBe("playing");
    });

    it("switches the background and saves it", () => {
      choose("game", "background", "gradient");
      expect(document.body.classList.contains("desktop--gradient")).toBe(true);
      expect(storage.saved().background).toBe("gradient");
    });

    it("saves every setting together", () => {
      choose("game", "expert");
      choose("game", "language", "ru");
      choose("game", "background", "gradient");
      expect(storage.saved()).toMatchObject({
        level: "expert",
        language: "ru",
        background: "gradient",
        marks: true,
      });
    });

    it("restores all of it on the next start", () => {
      choose("game", "expert");
      choose("game", "language", "ru");
      choose("game", "marks");
      app = start({ storage, random: noRandomNeeded });
      expect(document.querySelectorAll(".cell")).toHaveLength(480);
      expect(title("game").textContent).toBe("Игра");
      expect(app.game.getSnapshot().marks).toBe(false);
    });

    it("closes the menu when the field is pressed", () => {
      title("game").click();
      cell(40).dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
          button: 0,
          buttons: 1,
        }),
      );
      expect(document.querySelector(".menubar__menu--open")).toBeNull();
    });
  });

  describe("Custom field dialog", () => {
    const storage = () => {
      const data = { value: null };
      return {
        getItem: () => data.value,
        setItem: (_k, v) => {
          data.value = v;
        },
        saved: () => JSON.parse(data.value),
      };
    };
    const openDialogFromMenu = () => {
      document.querySelector('[data-menu="game"] > .menubar__item').click();
      document.querySelector('.menu__item[data-item="custom"]').click();
    };
    const input = (name) =>
      document.querySelector(`.dialog input[name="${name}"]`);
    let store;

    beforeEach(() => {
      store = storage();
      app = start({ storage: store, random: () => 0.5 });
    });

    it("opens from the Game menu with the saved custom values", () => {
      openDialogFromMenu();
      expect(document.querySelector(".dialog")).not.toBeNull();
      expect(input("height").value).toBe("9");
      expect(input("mines").value).toBe("10");
    });

    it("starts a custom game on OK and saves it", () => {
      openDialogFromMenu();
      input("height").value = "10";
      input("width").value = "12";
      input("mines").value = "20";
      document.querySelector(".dialog__button--primary").click();
      expect(document.querySelectorAll(".cell")).toHaveLength(120);
      expect(digits(".led--mines")).toBe("020");
      expect(store.saved()).toMatchObject({
        level: "custom",
        custom: { width: 12, height: 10, mines: 20 },
      });
      expect(document.querySelector(".dialog")).toBeNull();
    });

    it("clamps what was typed", () => {
      openDialogFromMenu();
      input("height").value = "500";
      input("width").value = "500";
      input("mines").value = "5000";
      document.querySelector(".dialog__button--primary").click();
      expect(document.querySelectorAll(".cell")).toHaveLength(30 * 24);
      expect(store.saved().custom).toEqual({
        width: 30,
        height: 24,
        mines: 667,
      });
    });

    it("keeps the current game when the dialog is cancelled", () => {
      app.game.open(80);
      openDialogFromMenu();
      document.querySelector(".window__button--close").click();
      expect(app.game.getSnapshot().state).not.toBe("ready");
      expect(store.saved()).toBeNull();
    });

    it("checks Custom in the menu and remembers the values for next time", () => {
      openDialogFromMenu();
      input("height").value = "10";
      input("width").value = "12";
      input("mines").value = "20";
      document.querySelector(".dialog__button--primary").click();
      document.querySelector('[data-menu="game"] > .menubar__item').click();
      expect(
        document
          .querySelector('.menu__item[data-item="custom"]')
          .classList.contains("menu__item--checked"),
      ).toBe(true);
      app = start({ storage: store, random: () => 0.5 });
      expect(document.querySelectorAll(".cell")).toHaveLength(120);
    });

    it("is translated", () => {
      app.i18n.setLanguage("ru");
      openDialogFromMenu();
      expect(document.querySelector(".dialog .window__title").textContent).toBe(
        "Особое поле",
      );
    });
  });

  describe("Help menu", () => {
    const openHelp = (id) => {
      document.querySelector('[data-menu="help"] > .menubar__item').click();
      document.querySelector(`.menu__item[data-item="${id}"]`).click();
    };
    const dialogTitle = () =>
      document.querySelector(".dialog .window__title")?.textContent;

    it("opens the About dialog", () => {
      openHelp("about");
      expect(dialogTitle()).toBe("About Minesweeper");
    });

    it("opens the Rules dialog", () => {
      openHelp("rules");
      expect(dialogTitle()).toBe("Rules");
    });

    it("shows the dialogs in the current language", () => {
      app.i18n.setLanguage("ru");
      openHelp("rules");
      expect(dialogTitle()).toBe("Правила");
    });

    it("leaves the game untouched", () => {
      app.game.open(80);
      openHelp("about");
      document.querySelector(".dialog__button").click();
      expect(app.game.getSnapshot().state).toBe("playing");
    });
  });

  describe("narrow screens", () => {
    const fitValue = () =>
      document.documentElement.style.getPropertyValue("--fit");
    let measured;

    // the window is 500 px wide at scale 1 for Beginner and 800 px for Expert
    function stubWindowWidth(screenWidth) {
      Object.defineProperty(document.documentElement, "clientWidth", {
        configurable: true,
        get: () => screenWidth,
      });
      measured = vi
        .spyOn(Element.prototype, "getBoundingClientRect")
        .mockImplementation(function () {
          if (!this.classList.contains("window")) return { width: 0 };
          const columns = Number(
            document
              .querySelector(".field")
              .style.getPropertyValue("--columns"),
          );
          const natural = columns === 30 ? 800 : 500;
          return { width: natural * (Number(fitValue()) || 1) };
        });
    }

    afterEach(() => {
      vi.restoreAllMocks();
      document.documentElement.style.removeProperty("--fit");
    });

    it("scales the window down at start", () => {
      stubWindowWidth(250);
      app = start();
      expect(fitValue()).toBe("0.5");
    });

    it("rescales when a bigger level is chosen", () => {
      stubWindowWidth(500);
      app = start();
      expect(fitValue()).toBe("1");
      document.querySelector('[data-menu="game"] > .menubar__item').click();
      document.querySelector('.menu__item[data-item="expert"]').click();
      expect(fitValue()).toBe("0.625");
    });

    it("does not measure the window on every move", () => {
      stubWindowWidth(250);
      app = start();
      measured.mockClear();
      app.game.open(80);
      expect(measured).not.toHaveBeenCalled();
    });
  });
});
