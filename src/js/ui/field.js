/** CSS classes of a cell, by the cell state from a game snapshot. */
const STATE_CLASSES = {
  closed: ["cell--closed"],
  flag: ["cell--closed", "cell--flag"],
  question: ["cell--closed", "cell--question"],
  open: ["cell--open"],
  mine: ["cell--open", "cell--mine"],
  exploded: ["cell--open", "cell--mine", "cell--exploded"],
  wrongFlag: ["cell--open", "cell--wrong-flag"],
};

function classNameFor({ state, adjacent }) {
  const classes = ["cell", ...STATE_CLASSES[state]];
  if (state === "open" && adjacent > 0) {
    classes.push(`cell--n${adjacent}`);
  }
  return classes.join(" ");
}

function textFor({ state, adjacent }) {
  return state === "open" && adjacent > 0 ? String(adjacent) : "";
}

/**
 * Draws the game field into a container. Cells are created once per field size
 * and updated in place afterwards, so a render only touches what changed.
 *
 * @param {HTMLElement} container element with the `field` grid styles
 * @returns {{render: (snapshot: import("../core/game.js").Snapshot) => void}}
 */
export function createFieldRenderer(container) {
  let width = 0;
  let height = 0;
  let cellElements = [];

  function rebuild(newWidth, newHeight) {
    width = newWidth;
    height = newHeight;
    container.style.setProperty("--columns", String(width));
    cellElements = Array.from({ length: width * height }, (_, index) => {
      const element = document.createElement("div");
      element.dataset.index = String(index);
      return element;
    });
    container.replaceChildren(...cellElements);
  }

  return {
    render(snapshot) {
      if (snapshot.width !== width || snapshot.height !== height) {
        rebuild(snapshot.width, snapshot.height);
      }
      snapshot.cells.forEach((cell, index) => {
        const element = cellElements[index];
        const className = classNameFor(cell);
        if (element.className !== className) {
          element.className = className;
        }
        const text = textFor(cell);
        if (element.textContent !== text) {
          element.textContent = text;
        }
      });
    },
  };
}
