/**
 * Playing from the keyboard (decision 34). The field has the keyboard focus and a
 * cursor cell: arrow keys move it, Space opens a closed cell or does a chord on an
 * opened number, F cycles flag / "?" / closed. F2 (new game) lives in controls.js.
 *
 * Keys are matched by `event.code`, so they work on any keyboard layout. Combinations
 * with Ctrl, Alt or Meta are left to the browser.
 *
 * @param {{
 *   field: HTMLElement,
 *   game: {getSnapshot: Function, subscribe: Function, open: Function, chord: Function, toggleMark: Function},
 *   onCursor: (index: number) => void
 * }} options `onCursor` is called with the cursor cell whenever it changes
 * @returns {{getCursor: () => number, destroy: () => void}}
 */
export function createKeyboardInput({ field, game, onCursor }) {
  let cursor = 0;

  function setCursor(index) {
    cursor = index;
    onCursor(cursor);
  }

  function move(dx, dy) {
    const { width, height } = game.getSnapshot();
    const x = (cursor % width) + dx;
    const y = Math.floor(cursor / width) + dy;
    if (x >= 0 && x < width && y >= 0 && y < height) {
      setCursor(y * width + x);
    }
  }

  function openOrChord() {
    const { state } = game.getSnapshot().cells[cursor];
    if (state === "open") {
      game.chord(cursor);
    } else {
      game.open(cursor);
    }
  }

  // `repeats`: whether holding the key down repeats the action
  const KEYS = {
    ArrowLeft: { run: () => move(-1, 0), repeats: true },
    ArrowRight: { run: () => move(1, 0), repeats: true },
    ArrowUp: { run: () => move(0, -1), repeats: true },
    ArrowDown: { run: () => move(0, 1), repeats: true },
    Space: { run: openOrChord, repeats: false },
    KeyF: { run: () => game.toggleMark(cursor), repeats: false },
  };

  function onKeyDown(event) {
    const key = KEYS[event.code];
    if (!key || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    if (key.repeats || !event.repeat) {
      key.run();
    }
  }

  const unsubscribe = game.subscribe(({ type }) => {
    if (type === "new") {
      setCursor(0);
    }
  });
  field.addEventListener("keydown", onKeyDown);
  onCursor(cursor);

  return {
    getCursor: () => cursor,
    destroy() {
      field.removeEventListener("keydown", onKeyDown);
      unsubscribe();
    },
  };
}
