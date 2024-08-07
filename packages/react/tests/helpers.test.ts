import { getRandomDecimal, getWeightedRandomVariant } from "../src/helpers";

describe("getWeightedRandomVariant", () => {
  it("should only return valid values", () => {
    const variants = ["A", "B", "C"] as const;

    const variant = getWeightedRandomVariant(variants);

    expect(variant).toBeDefined();
  });

  it("should work with weights", () => {
    const variants = ["A", "B", "C"] as const;

    for (let i = 0; i < 100; i++) {
      const variant = getWeightedRandomVariant(variants, [0, 0, 1]);

      expect(variant).toBe<typeof variant>("C");
    }

    for (let i = 0; i < 100; i++) {
      const variant = getWeightedRandomVariant(variants, [0.5, 0.5, 0]);

      expect(["A", "B"].includes(variant)).toBeTruthy();
      expect(variant).not.toBe("C");
    }
  });
});

describe("getRandomDecimal", () => {
  it("should return a number between 0 and 1", () => {
    for (let i = 0; i < 100; i++) {
      const decimal = getRandomDecimal();
      expect(decimal).toBeGreaterThanOrEqual(0);
      expect(decimal).toBeLessThanOrEqual(1);
    }
  });
});
