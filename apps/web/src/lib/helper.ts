export const getUpdatedWeights = ({
  indexToUpdate,
  newWeight,
  weights,
}: {
  indexToUpdate: number;
  newWeight: number;
  weights: number[];
}) => {
  if (
    indexToUpdate < 0 ||
    indexToUpdate > weights.length - 1 ||
    newWeight < 0 ||
    newWeight > 100
  ) {
    return weights;
  }

  if (weights.length > 2) {
    const updatedWeights = [...weights];
    updatedWeights[indexToUpdate] = newWeight;
    return updatedWeights;
  }

  const maxValue = 100;
  const remaining = maxValue - newWeight;

  return (
    weights
      .map((v, i) => {
        if (i === indexToUpdate) return newWeight;
        const oldRemaining = maxValue - (weights.at(indexToUpdate) || 0);
        if (oldRemaining) return (remaining * v) / oldRemaining;
        return remaining / (weights.length - 1);
      })
      // round values to nearest 0.5
      .map((weight) => Math.round(weight * 2) / 2)
  );
};

// biome-ignore lint/suspicious/noExplicitAny:>
export const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      // biome-ignore lint/suspicious/noAssignInExpressions:>
      (groups[key(item)] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
