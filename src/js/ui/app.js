import { attachTimer, createTimer } from "../core/timer.js";
import { createGame } from "../core/game.js";
import en from "../i18n/en.js";
import ru from "../i18n/ru.js";
import { createI18n, detectLanguage } from "../services/i18n.js";
import { createSettingsStore, levelConfig } from "../services/settings.js";
import { createControls } from "./controls.js";
import { openCustomDialog } from "./custom-dialog.js";
import { createFieldRenderer } from "./field.js";
import { createFit } from "./fit.js";
import { openAboutDialog, openRulesDialog } from "./help-dialogs.js";
import { createKeyboardInput } from "./keyboard.js";
import { createMenuBar } from "./menu.js";
import { buildMenus } from "./menus.js";
import { createMouseInput } from "./mouse.js";
import { createStatusRenderer } from "./status.js";
import { applyBackground, applyTexts } from "./texts.js";
import { createTouchInput } from "./touch.js";

/**
 * Wires the game, the timer and the renderers to the page.
 * Everything the app needs from the outside is passed in, so it can be tested.
 *
 * @param {{
 *   document: Document,
 *   random: () => number,
 *   scheduler: {setInterval: Function, clearInterval: Function, setTimeout: Function, clearTimeout: Function},
 *   storage?: {getItem: Function, setItem: Function} | null,
 *   browserLanguage?: string
 * }} options `storage` is localStorage (or null), `browserLanguage` is navigator.language
 * @returns {{
 *   game: ReturnType<typeof createGame>,
 *   timer: ReturnType<typeof createTimer>,
 *   mouse: ReturnType<typeof createMouseInput>,
 *   touch: ReturnType<typeof createTouchInput>,
 *   keyboard: ReturnType<typeof createKeyboardInput>,
 *   controls: ReturnType<typeof createControls>,
 *   i18n: ReturnType<typeof createI18n>,
 *   menuBar: ReturnType<typeof createMenuBar>
 * }}
 */
export function startApp({
  document,
  random,
  scheduler,
  storage = null,
  browserLanguage,
}) {
  const find = (selector) => document.querySelector(selector);

  const store = createSettingsStore({
    storage,
    defaultLanguage: detectLanguage(browserLanguage),
  });
  const settings = store.load();
  const i18n = createI18n({
    dictionaries: { ru, en },
    language: settings.language,
  });
  applyBackground(document, settings.background);
  applyTexts({ document, i18n });
  i18n.subscribe(() => applyTexts({ document, i18n }));

  const game = createGame({
    random,
    config: levelConfig(settings),
    marks: settings.marks,
  });
  const timer = createTimer({ scheduler });
  attachTimer(game, timer);

  const fieldElement = find(".field");
  const field = createFieldRenderer(fieldElement);
  const status = createStatusRenderer({
    minesLed: find(".led--mines"),
    timerLed: find(".led--timer"),
    smiley: find(".smiley"),
  });

  function render(snapshot) {
    field.render(snapshot);
    status.renderMines(snapshot.minesLeft);
    status.renderSmiley(snapshot.state, isPressing());
  }

  function onFeedback({ pressedCells, pressing }) {
    field.setPressed(pressedCells);
    status.renderSmiley(game.getSnapshot().state, pressing);
  }
  const mouse = createMouseInput({
    document,
    field: fieldElement,
    game,
    onFeedback,
  });
  const touch = createTouchInput({
    document,
    field: fieldElement,
    game,
    scheduler,
    onFeedback,
  });
  const isPressing = () => mouse.isPressing() || touch.isPressing();

  const keyboard = createKeyboardInput({
    field: fieldElement,
    game,
    onCursor: (index) => field.setCursor(index),
  });
  const controls = createControls({ document, smiley: find(".smiley"), game });

  function updateSettings(patch) {
    Object.assign(settings, patch);
    store.save(settings);
  }

  const actions = {
    newGame: () => game.newGame(),
    setLevel(level) {
      updateSettings({ level });
      game.newGame(levelConfig(settings));
    },
    toggleMarks() {
      updateSettings({ marks: !settings.marks });
      game.setMarks(settings.marks);
    },
    setLanguage(language) {
      updateSettings({ language });
      i18n.setLanguage(language);
    },
    setBackground(background) {
      updateSettings({ background });
      applyBackground(document, background);
    },
    about: () => openAboutDialog({ document, t: i18n.t }),
    rules: () => openRulesDialog({ document, t: i18n.t }),
    customField() {
      openCustomDialog({
        document,
        t: i18n.t,
        current: settings.custom,
        onSubmit(custom) {
          updateSettings({ level: "custom", custom });
          game.newGame(levelConfig(settings));
          menuBar.render(); // the dialog closes after the menu action, so refresh the check marks
        },
      });
    },
  };

  const menuBar = createMenuBar({
    container: find(".menubar"),
    document,
    getMenus: () => buildMenus({ t: i18n.t, settings, actions }),
  });
  menuBar.render();
  i18n.subscribe(() => menuBar.render());

  const fit = createFit({ document, window: document.defaultView });
  fit.update();

  game.subscribe(({ type, snapshot }) => {
    render(snapshot);
    if (type === "new") fit.update(); // the field size may have changed
  });
  timer.subscribe(({ seconds }) => status.renderTimer(seconds));

  render(game.getSnapshot());
  status.renderTimer(timer.getSeconds());

  return { game, timer, mouse, touch, keyboard, controls, i18n, menuBar };
}
