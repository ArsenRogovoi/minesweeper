import { describe, expect, it } from "vitest";
import { createEmitter } from "../../src/js/core/emitter.js";

describe("createEmitter", () => {
  it("calls every listener with the event, in subscription order", () => {
    const emitter = createEmitter();
    const calls = [];
    emitter.subscribe((e) => calls.push(["a", e]));
    emitter.subscribe((e) => calls.push(["b", e]));
    emitter.emit({ type: "x" });
    expect(calls).toEqual([
      ["a", { type: "x" }],
      ["b", { type: "x" }],
    ]);
  });

  it("stops calling a listener after it unsubscribes", () => {
    const emitter = createEmitter();
    const calls = [];
    const unsubscribe = emitter.subscribe((e) => calls.push(e));
    unsubscribe();
    emitter.emit({ type: "x" });
    expect(calls).toEqual([]);
  });

  it("lets a listener unsubscribe itself while an event is being delivered", () => {
    const emitter = createEmitter();
    const calls = [];
    const unsubscribe = emitter.subscribe(() => {
      calls.push("first");
      unsubscribe();
    });
    emitter.subscribe(() => calls.push("second"));
    emitter.emit({ type: "x" });
    emitter.emit({ type: "x" });
    expect(calls).toEqual(["first", "second", "second"]);
  });
});
