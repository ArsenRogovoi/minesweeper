const BUTTON_NAMES = { 0: "left", 1: "middle", 2: "right" };

/**
 * Mouse input for the field: turns pointer events into game commands and tells
 * the UI what to show while buttons are held (pressed cells, surprised smiley).
 *
 * Left button: the cell under the pointer looks pressed; moving the mouse moves
 * the pressed look; the cell opens on release, and releasing outside the field
 * does nothing.
 *
 * Right button: cycles the mark (flag, "?", closed) on press. The browser context
 * menu is disabled on the field.
 *
 * Touch and pen pointers are ignored here (see the touch stage).
 *
 * @param {{
 *   document: Document,
 *   field: HTMLElement,
 *   game: {getSnapshot: Function, open: Function, toggleMark: Function},
 *   onFeedback: (feedback: {pressedCells: number[], pressing: boolean}) => void
 * }} options
 * @returns {{isPressing: () => boolean, destroy: () => void}}
 */
export function createMouseInput({ document, field, game, onFeedback }) {
  const held = new Set(); // names of the buttons that went down on the field
  let mode = null; // "open" | "mark" | "chord", set by the first press of a gesture
  let target = null; // index of the cell under the pointer, null outside the field
  let lastFeedback = "";

  function cellIndexOf(event) {
    const cell = event.target.closest?.(".cell");
    return cell && field.contains(cell) ? Number(cell.dataset.index) : null;
  }

  function isPlaying() {
    const { state } = game.getSnapshot();
    return state === "ready" || state === "playing";
  }

  function isPressable(index) {
    const { state } = game.getSnapshot().cells[index];
    return state === "closed" || state === "question";
  }

  function refresh() {
    const pressedCells =
      mode === "open" && target !== null && isPressable(target) ? [target] : [];
    const feedback = { pressedCells, pressing: held.size > 0 };
    const key = JSON.stringify(feedback);
    if (key !== lastFeedback) {
      lastFeedback = key;
      onFeedback(feedback);
    }
  }

  /** Both buttons or the middle one make a chord; otherwise the first button decides. */
  function updateMode() {
    if (held.has("middle") || (held.has("left") && held.has("right"))) {
      mode = "chord";
    } else if (mode === null) {
      mode = held.has("left") ? "open" : "mark";
    }
  }

  function reset() {
    mode = null;
    held.clear();
    target = null;
    refresh();
  }

  function onDown(event) {
    const index = cellIndexOf(event);
    if (event.pointerType !== "mouse" || index === null || !isPlaying()) {
      return;
    }
    const button = BUTTON_NAMES[event.button];
    if (button === "right" && held.size === 0) {
      game.toggleMark(index);
    }
    held.add(button);
    updateMode();
    target = index;
    refresh();
  }

  function onContextMenu(event) {
    event.preventDefault();
  }

  function onMove(event) {
    if (event.pointerType !== "mouse" || held.size === 0) {
      return;
    }
    if (event.buttons === 0) {
      reset(); // the button was released outside the window
      return;
    }
    target = cellIndexOf(event);
    refresh();
  }

  function onUp(event) {
    if (event.pointerType !== "mouse" || held.size === 0) {
      return;
    }
    const index = cellIndexOf(event);
    const opens = mode === "open" && event.button === 0 && index !== null;
    held.delete(BUTTON_NAMES[event.button]);
    if (held.size === 0) {
      reset();
    }
    if (opens) {
      game.open(index);
    }
  }

  function onCancel() {
    reset();
  }

  field.addEventListener("pointerdown", onDown);
  field.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);

  return {
    isPressing: () => held.size > 0,
    destroy() {
      field.removeEventListener("pointerdown", onDown);
      field.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
    },
  };
}
