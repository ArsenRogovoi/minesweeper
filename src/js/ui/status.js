const MAX_VALUE = 999;
const MIN_VALUE = -99;

/**
 * Digits for a three-digit LED display: "0"-"9" and "minus".
 * Values are limited to -99..999; a negative value is shown as a minus and two digits.
 * @param {number} value
 * @returns {string[]}
 */
export function formatLed(value) {
  if (value < 0) {
    const [tens, ones] = String(-Math.max(value, MIN_VALUE)).padStart(2, "0");
    return ["minus", tens, ones];
  }
  return [...String(Math.min(value, MAX_VALUE)).padStart(3, "0")];
}

/**
 * Which smiley to show.
 * @param {"ready"|"playing"|"won"|"lost"} state game state
 * @param {boolean} [pressed] a mouse button is held on the field
 * @returns {"normal"|"surprised"|"dead"|"won"}
 */
export function smileyFace(state, pressed = false) {
  if (state === "lost") {
    return "dead";
  }
  if (state === "won") {
    return "won";
  }
  return pressed ? "surprised" : "normal";
}

function drawLed(led, value) {
  const digits = formatLed(value);
  led.querySelectorAll(".led__digit").forEach((element, index) => {
    element.className = `led__digit led__digit--${digits[index]}`;
  });
}

/**
 * Draws the status panel: mine counter, timer and smiley.
 * @param {{minesLed: HTMLElement, timerLed: HTMLElement, smiley: HTMLElement}} elements
 */
export function createStatusRenderer({ minesLed, timerLed, smiley }) {
  return {
    renderMines: (value) => drawLed(minesLed, value),
    renderTimer: (seconds) => drawLed(timerLed, seconds),
    renderSmiley(state, pressed = false) {
      smiley.className = `smiley smiley--${smileyFace(state, pressed)}`;
    },
  };
}
