import { describe, expect, it } from "vitest";
import {
  getRandomDecimal,
  getWeightedRandomVariant,
  validateWeights,
} from "../src/helpers";

describe("helpers", () => {
  it("generates a random decimal between 0 and 1", () => {
    const r = getRandomDecimal();
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });

  it("validates weights correctly", () => {
    const variants = ["A", "B"] as const;
    const valid = validateWeights(variants, [0.5, 0.5]);
    expect(valid).toEqual([0.5, 0.5]);

    const invalid = validateWeights(variants, [0.2, 0.2]);
    expect(invalid).toEqual([0.5, 0.5]);
  });

  it("selects weighted random variant", () => {
    const variants = ["A", "B"] as const;
    const selected = getWeightedRandomVariant(variants, [1, 0]);
    expect(selected).toBe("A");
  });
});
