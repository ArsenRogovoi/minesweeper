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

function classNameFor({ state, adjacent }, { pressed, cursor }) {
  const classes = ["cell", ...STATE_CLASSES[state]];
  if (pressed) {
    classes.push("cell--pressed");
  }
  if (cursor) {
    classes.push("cell--cursor");
  }
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
 * @returns {{
 *   render: (snapshot: import("../core/game.js").Snapshot) => void,
 *   setPressed: (indices: number[]) => void,
 *   setCursor: (index: number|null) => void
 * }} `setPressed` gives cells the look of a held-down button; `setCursor` marks the
 *   cell of the keyboard cursor
 */
export function createFieldRenderer(container) {
  let width = 0;
  let height = 0;
  let cellElements = [];
  let cells = [];
  let pressed = new Set();
  let cursor = null;

  function rebuild(newWidth, newHeight) {
    width = newWidth;
    height = newHeight;
    pressed = new Set();
    container.style.setProperty("--columns", String(width));
    cellElements = Array.from({ length: width * height }, (_, index) => {
      const element = document.createElement("div");
      element.dataset.index = String(index);
      return element;
    });
    container.replaceChildren(...cellElements);
  }

  function update(index) {
    const element = cellElements[index];
    const className = classNameFor(cells[index], {
      pressed: pressed.has(index),
      cursor: cursor === index,
    });
    if (element.className !== className) {
      element.className = className;
    }
    const text = textFor(cells[index]);
    if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  return {
    render(snapshot) {
      if (snapshot.width !== width || snapshot.height !== height) {
        rebuild(snapshot.width, snapshot.height);
      }
      cells = snapshot.cells;
      cells.forEach((_, index) => update(index));
    },

    setCursor(index) {
      const previous = cursor;
      cursor = index;
      [previous, index].filter((i) => cells[i]).forEach(update);
    },

    setPressed(indices) {
      const next = new Set(indices);
      const changed = [...pressed, ...next].filter(
        (index) => pressed.has(index) !== next.has(index),
      );
      pressed = next;
      changed.forEach(update);
    },
  };
}
