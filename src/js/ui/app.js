import { attachTimer, createTimer } from "../core/timer.js";
import { createGame } from "../core/game.js";
import { createFieldRenderer } from "./field.js";
import { createStatusRenderer } from "./status.js";

/**
 * Wires the game, the timer and the renderers to the page.
 * Everything the app needs from the outside is passed in, so it can be tested.
 *
 * @param {{
 *   document: Document,
 *   random: () => number,
 *   scheduler: {setInterval: Function, clearInterval: Function}
 * }} options
 * @returns {{game: ReturnType<typeof createGame>, timer: ReturnType<typeof createTimer>}}
 */
export function startApp({ document, random, scheduler }) {
  const find = (selector) => document.querySelector(selector);

  const game = createGame({ random });
  const timer = createTimer({ scheduler });
  attachTimer(game, timer);

  const field = createFieldRenderer(find(".field"));
  const status = createStatusRenderer({
    minesLed: find(".led--mines"),
    timerLed: find(".led--timer"),
    smiley: find(".smiley"),
  });

  function render(snapshot) {
    field.render(snapshot);
    status.renderMines(snapshot.minesLeft);
    status.renderSmiley(snapshot.state);
  }

  game.subscribe(({ snapshot }) => render(snapshot));
  timer.subscribe(({ seconds }) => status.renderTimer(seconds));

  render(game.getSnapshot());
  status.renderTimer(timer.getSeconds());

  return { game, timer };
}
