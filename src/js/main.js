// Entry point: wires services, core and UI together (see docs/PLAN.md).
import { startApp } from "./ui/app.js";

startApp({ document, random: Math.random, scheduler: window });
