import { getWeightedRandomVariant, validateWeights } from "../src/mathHelpers";

describe("Math helpers", () => {
  it("validates weight", () => {
    const variants = ["variant1", "variant2"];
    const weight = [0.25, 0.75];

    const validatedWeights1 = validateWeights(variants, weight);
    expect(validatedWeights1).toEqual([0.25, 0.75]);

    const validatedWeights2 = validateWeights(variants);
    expect(validatedWeights2).toEqual([0.5, 0.5]);

    expect(validateWeights(["a", "b", "c"], [0.3, 0.3, 0.3])).toEqual([
      1 / 3,
      1 / 3,
      1 / 3,
    ]);
  });

  it("gets proper variants", () => {
    const variants = ["a", "b", "c"];
    expect(getWeightedRandomVariant(variants, [0.3, 0.3, 0.3])).oneOf(variants);
  });

  it("produces roughly equal distribution for equal weights", () => {
    const variants = ["a", "b", "c"] as const;
    type Variant = (typeof variants)[number];
    const weights = [1 / 3, 1 / 3, 1 / 3];
    const iterations = 10_000;
    const counts: Record<Variant, number> = { a: 0, b: 0, c: 0 };

    // Run many iterations to get a statistically significant sample
    for (let i = 0; i < iterations; i++) {
      const result = getWeightedRandomVariant(variants, weights);
      counts[result as Variant]++;
    }

    // Check that each variant appears roughly 1/3 of the time (within 5% margin)
    const expectedCount = iterations / 3;
    const marginOfError = 0.05 * iterations; // 5% margin of error

    Object.values(counts).forEach((count) => {
      expect(count).toBeGreaterThan(expectedCount - marginOfError);
      expect(count).toBeLessThan(expectedCount + marginOfError);
    });
  });
});
