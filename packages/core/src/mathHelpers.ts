// taken from: https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues
// crypto.getRandomValues() is better than Math.random() because it's cryptographically secure
// fallback to Math.random() if crypto.getRandomValues() is not available
function getRandomDecimal() {
  if (typeof window !== "undefined" && window.crypto) {
    const randomBuffer = new Uint32Array(1);

    window.crypto.getRandomValues(randomBuffer);

    return randomBuffer[0] / (0xffffffff + 1);
  }
  return Math.random();
}

function getWeightedRandomNumber<T extends Record<string, number>>(spec: T): keyof T {
  let i: keyof T;
  let sum = 0;
  const r = getRandomDecimal();

  for (i in spec) {
    sum += spec[i];
    if (r <= sum) break;
  }

  return i!;
}

function getDefaultWeights<Variants extends ReadonlyArray<string>>(variants: Variants) {
  return Array.from<number>({ length: variants.length }).fill(1 / variants.length);
}

export function validateWeights<
  Variants extends ReadonlyArray<string>,
  Weights extends Array<number>,
>(variants: Variants, weights?: Weights): Weights {
  const sum = weights?.reduce((acc, weight) => acc + weight, 0);
  return weights != null && sum === 1 && variants.length === weights.length
    ? weights
    : (getDefaultWeights(variants) as Weights);
}

export function getWeightedRandomVariant<Variants extends ReadonlyArray<string>>(
  variants: Variants,
  weights?: Array<number>
): Variants[number] {
  const validatedWeights = validateWeights(variants, weights);
  return getWeightedRandomNumber(
    variants.reduce(
      (acc, variant, index) => {
        acc[variant as Variants[number]] = validatedWeights[index];
        return acc;
      },
      {} as Record<Variants[number], number>
    )
  );
}

export function getVariantWithHeighestWeightOrFirst<Variants extends ReadonlyArray<string>>(
  variants: Variants,
  weights?: Array<number>
): Variants[number] {
  const validatedWeights = validateWeights(variants, weights);
  let variantWithHeighestWeight = variants[0];

  for (let i = 1; i < variants.length; i++) {
    if (validatedWeights[i] > validatedWeights[i - 1]) {
      variantWithHeighestWeight = variants[i];
    }
  }

  return variantWithHeighestWeight;
}
