/** How long a finger must stay on a cell to place a mark (decision P5). */
export const LONG_PRESS_MS = 400;

/**
 * Touch and pen input for the field.
 *
 * Tap on a closed cell (or one with "?") opens it, tap on an opened number does a chord,
 * long press on a closed cell cycles the mark (flag, "?", closed) like a right click.
 * The long press acts as soon as the time is up, without waiting for the finger to lift.
 *
 * Sliding the finger to another cell, or the browser taking the gesture over (pointercancel),
 * cancels it. Only one finger is tracked at a time; mouse pointers are left to mouse.js.
 *
 * @param {{
 *   document: Document,
 *   field: HTMLElement,
 *   game: {getSnapshot: Function, open: Function, toggleMark: Function, chord: Function},
 *   scheduler: {setTimeout: Function, clearTimeout: Function},
 *   onFeedback: (feedback: {pressedCells: number[], pressing: boolean}) => void
 * }} options `scheduler` has the same shape as `window`
 * @returns {{isPressing: () => boolean, destroy: () => void}}
 */
export function createTouchInput({
  document,
  field,
  game,
  scheduler,
  onFeedback,
}) {
  let pointerId = null; // the finger being tracked, null when none
  let target = null; // index of the cell the finger went down on, null once cancelled
  let longPressed = false;
  let timer = null;

  function cellIndexOf(event) {
    const cell = event.target.closest?.(".cell");
    return cell && field.contains(cell) ? Number(cell.dataset.index) : null;
  }

  function isPlaying() {
    const { state } = game.getSnapshot();
    return state === "ready" || state === "playing";
  }

  function stateOf(index) {
    return game.getSnapshot().cells[index].state;
  }

  function feedback() {
    const pressable =
      target !== null &&
      !longPressed &&
      ["closed", "question"].includes(stateOf(target));
    onFeedback({
      pressedCells: pressable ? [target] : [],
      pressing: pointerId !== null,
    });
  }

  function stopTimer() {
    scheduler.clearTimeout(timer);
    timer = null;
  }

  function reset() {
    stopTimer();
    pointerId = null;
    target = null;
    longPressed = false;
    feedback();
  }

  function onLongPress() {
    timer = null;
    if (target === null || stateOf(target) === "open") {
      return;
    }
    longPressed = true;
    game.toggleMark(target);
    feedback();
  }

  const isTouch = (event) => event.pointerType !== "mouse";

  function onDown(event) {
    const index = cellIndexOf(event);
    if (
      !isTouch(event) ||
      pointerId !== null ||
      index === null ||
      !isPlaying()
    ) {
      return;
    }
    pointerId = event.pointerId;
    target = index;
    timer = scheduler.setTimeout(onLongPress, LONG_PRESS_MS);
    feedback();
  }

  function onMove(event) {
    if (!isTouch(event) || event.pointerId !== pointerId || target === null) {
      return;
    }
    if (cellIndexOf(event) !== target) {
      target = null;
      stopTimer();
      feedback();
    }
  }

  function onUp(event) {
    if (!isTouch(event) || event.pointerId !== pointerId) {
      return;
    }
    const index = target;
    const wasLongPress = longPressed;
    reset();
    if (index === null || wasLongPress || cellIndexOf(event) !== index) {
      return;
    }
    if (stateOf(index) === "open") {
      game.chord(index);
    } else {
      game.open(index);
    }
  }

  function onCancel(event) {
    if (isTouch(event) && event.pointerId === pointerId) {
      reset();
    }
  }

  field.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);

  return {
    isPressing: () => pointerId !== null,
    destroy() {
      stopTimer();
      field.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
    },
  };
}
