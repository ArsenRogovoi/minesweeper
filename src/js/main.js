// Entry point: wires services, core and UI together (see docs/PLAN.md).
import { safeLocalStorage } from "./services/settings.js";
import { startApp } from "./ui/app.js";

startApp({
  document,
  random: Math.random,
  scheduler: window,
  storage: safeLocalStorage(window),
  browserLanguage: navigator.language,
});
