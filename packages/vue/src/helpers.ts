// taken from https://stackoverflow.com/questions/52489261/typescript-can-i-define-an-n-length-tuple-type
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

// taken from: https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues
// crypto.getRandomValues() is better than Math.random() because it's cryptographically secure
// fallback to Math.random() if crypto.getRandomValues() is not available
export function getRandomDecimal() {
  if (typeof window !== "undefined" && window.crypto) {
    const randomBuffer = new Uint32Array(1);

    window.crypto.getRandomValues(randomBuffer);

    return randomBuffer[0] / (0xffffffff + 1);
  }
  return Math.random();
}

function weightedRand2<T extends Record<string, number>>(spec: T): keyof T {
  let i: keyof T;
  let sum = 0;
  const r = getRandomDecimal();

  for (i in spec) {
    sum += spec[i];
    if (r <= sum) break;
  }
  // biome-ignore lint/style/noNonNullAssertion:>
  return i!;
}

export function getWeightedRandomVariant<
  Variants extends ReadonlyArray<string>,
>(
  variants: Variants,
  weights?: Tuple<number, Variants["length"]>
): Variants[number] {
  const validatedWeights = validateWeights(variants, weights);
  return weightedRand2(
    variants.reduce(
      (acc, variant, index) => {
        acc[variant as Variants[number]] = validatedWeights[index];
        return acc;
      },
      {} as Record<Variants[number], number>
    )
  );
}

const getDefaultWeights = <Variants extends ReadonlyArray<string>>(
  variants: Variants
) => {
  return Array.from<number>({ length: variants.length }).fill(
    1 / variants.length
  );
};

export function validateWeights<
  Variants extends ReadonlyArray<string>,
  Weights extends Tuple<number, Variants["length"]>,
>(variants: Variants, weights?: Weights): Weights {
  const sum = weights?.reduce((acc, weight) => acc + weight, 0);
  return weights != null && sum === 1 && variants.length === weights.length
    ? weights
    : (getDefaultWeights(variants) as Weights);
}
