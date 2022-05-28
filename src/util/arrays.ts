
export const arrayBinned = <T>(arr: T[], binner: (item: T) => string): Record<string, T[]> => {
  const bins: Record<string, T[]> = {};
  arr.forEach((item) => {
    const bin = binner(item);
    if (!bins[bin]) {
      bins[bin] = [];
    }
    bins[bin].push(item);
  });
  return bins;
};

export const arrayUnique = <T>(arr: T[], keyGetter?: (item: T) => string): T[] => {
  if (!keyGetter) {
    return [...new Set(arr)];
  }
  return [...new Map(arr.map((v) => [keyGetter(v), v])).values()];
};
