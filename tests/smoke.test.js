import { describe, expect, it } from "vitest";

describe("test pipeline", () => {
  it("runs in a jsdom environment", () => {
    document.body.innerHTML = '<p id="x">ok</p>';
    expect(document.getElementById("x").textContent).toBe("ok");
  });
});
