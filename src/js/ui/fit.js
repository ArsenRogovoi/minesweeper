/**
 * Scales the whole window down so it fits the screen width (decision 37). The scale is the
 * `--fit` CSS variable on <html>: 1 when the window fits, below 1 on narrow screens. It is
 * never above 1. Call `update()` when the window size can change (a new field size).
 *
 * @param {{document: Document, window: EventTarget}} options
 * @returns {{update: () => void, getFit: () => number, destroy: () => void}}
 */
export function createFit({ document, window }) {
  const root = document.documentElement;
  const windowElement = document.querySelector(".window");
  let fit = 1;

  function update() {
    // the window width is proportional to --fit, so dividing gives the width at scale 1
    const naturalWidth = windowElement.getBoundingClientRect().width / fit;
    if (!naturalWidth) return;
    const available = root.clientWidth;
    // round down to 3 decimals: a rounded-up scale could overflow by a pixel
    fit =
      naturalWidth > available
        ? Math.floor((available / naturalWidth) * 1000) / 1000
        : 1;
    root.style.setProperty("--fit", String(fit));
  }

  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);

  return {
    update,
    getFit: () => fit,
    destroy() {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    },
  };
}
