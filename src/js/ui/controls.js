/**
 * Ways to start a new game: a click on the smiley and the F2 key.
 * @param {{
 *   document: Document,
 *   smiley: HTMLElement,
 *   game: {newGame: Function}
 * }} options
 * @returns {{destroy: () => void}}
 */
export function createControls({ document, smiley, game }) {
  function onSmileyClick() {
    game.newGame();
  }

  function onKeyDown(event) {
    if (event.key === "F2") {
      event.preventDefault();
      game.newGame();
    }
  }

  smiley.addEventListener("click", onSmileyClick);
  document.addEventListener("keydown", onKeyDown);

  return {
    destroy() {
      smiley.removeEventListener("click", onSmileyClick);
      document.removeEventListener("keydown", onKeyDown);
    },
  };
}
