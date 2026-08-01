import { describe, it, expect } from "vitest";
import { hexToHslTriplet } from "./branding";

describe("hexToHslTriplet", () => {
  it("converts a known hex to its HSL triplet", () => {
    expect(hexToHslTriplet("#4f46e5")).toBe("243 75% 59%");
  });

  it("handles pure white and black", () => {
    expect(hexToHslTriplet("#ffffff")).toBe("0 0% 100%");
    expect(hexToHslTriplet("#000000")).toBe("0 0% 0%");
  });

  it("returns null for invalid input", () => {
    expect(hexToHslTriplet("not-a-color")).toBeNull();
    expect(hexToHslTriplet("#fff")).toBeNull();
  });
});
