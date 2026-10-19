import { beforeEach, describe, expect, it } from "vitest";
import { createFit } from "../../src/js/ui/fit.js";

let windowElement;
let fakeWindow;
let screenWidth;
// width of the game window at fit 1; the window shrinks together with --fit
const NATURAL = 510;

function fitValue() {
  return document.documentElement.style.getPropertyValue("--fit");
}

beforeEach(() => {
  document.documentElement.style.removeProperty("--fit");
  document.body.innerHTML = '<div class="window"></div>';
  windowElement = document.querySelector(".window");
  screenWidth = 1000;
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    get: () => screenWidth,
  });
  windowElement.getBoundingClientRect = () => ({
    width: NATURAL * Number(fitValue() || 1),
  });
  fakeWindow = new EventTarget();
});

describe("createFit", () => {
  it("keeps the scale 1 when the window fits", () => {
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    expect(fit.getFit()).toBe(1);
    expect(fitValue()).toBe("1");
  });

  it("scales the window down to the screen width", () => {
    screenWidth = 255;
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    expect(fit.getFit()).toBe(0.5);
    expect(fitValue()).toBe("0.5");
  });

  it("rounds the scale down so the window never overflows", () => {
    screenWidth = 360;
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    expect(fit.getFit()).toBe(0.705); // 360 / 510 = 0.70588...
  });

  it("gives the same result when called again with the window already scaled", () => {
    screenWidth = 255;
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    fit.update();
    expect(fit.getFit()).toBe(0.5);
  });

  it("grows back to 1 when the screen becomes wide enough", () => {
    screenWidth = 255;
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    screenWidth = 800;
    fit.update();
    expect(fit.getFit()).toBe(1);
  });

  it("updates on window resize and orientation change", () => {
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    screenWidth = 255;
    fakeWindow.dispatchEvent(new Event("resize"));
    expect(fit.getFit()).toBe(0.5);
    screenWidth = 1000;
    fakeWindow.dispatchEvent(new Event("orientationchange"));
    expect(fit.getFit()).toBe(1);
  });

  it("does nothing when the window has no size yet", () => {
    windowElement.getBoundingClientRect = () => ({ width: 0 });
    const fit = createFit({ document, window: fakeWindow });
    fit.update();
    expect(fit.getFit()).toBe(1);
  });

  it("stops listening after destroy", () => {
    const fit = createFit({ document, window: fakeWindow });
    fit.destroy();
    screenWidth = 255;
    fakeWindow.dispatchEvent(new Event("resize"));
    expect(fit.getFit()).toBe(1);
  });
});
