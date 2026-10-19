const BUTTON_NAMES = { 0: "left", 1: "middle", 2: "right" };

/**
 * Mouse input for the field: turns pointer events into game commands and tells
 * the UI what to show while buttons are held (pressed cells, surprised smiley).
 *
 * Left button: the cell under the pointer looks pressed; moving the mouse moves
 * the pressed look; the cell opens on release, and releasing outside the field
 * does nothing.
 *
 * Touch and pen pointers are ignored here (see the touch stage).
 *
 * @param {{
 *   document: Document,
 *   field: HTMLElement,
 *   game: {getSnapshot: Function, open: Function},
 *   onFeedback: (feedback: {pressedCells: number[], pressing: boolean}) => void
 * }} options
 * @returns {{isPressing: () => boolean, destroy: () => void}}
 */
export function createMouseInput({ document, field, game, onFeedback }) {
  const held = new Set(); // names of the buttons that went down on the field
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
      target !== null && held.size > 0 && isPressable(target) ? [target] : [];
    const feedback = { pressedCells, pressing: held.size > 0 };
    const key = JSON.stringify(feedback);
    if (key !== lastFeedback) {
      lastFeedback = key;
      onFeedback(feedback);
    }
  }

  function reset() {
    held.clear();
    target = null;
    refresh();
  }

  function onDown(event) {
    const index = cellIndexOf(event);
    if (event.pointerType !== "mouse" || index === null || !isPlaying()) {
      return;
    }
    held.add(BUTTON_NAMES[event.button]);
    target = index;
    refresh();
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
    const opens = held.size === 1 && held.has("left") && index !== null;
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
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);

  return {
    isPressing: () => held.size > 0,
    destroy() {
      field.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
    },
  };
}
