export const objectFilter = <K extends string, V>(
  object: Record<K, V>,
  filter: (key: K, value: V, index: number, array: [K, V][]) => boolean,
): Record<K, V> => Object.fromEntries(
  (Object.entries(object) as [K, V][])
    .filter(([key, value], i, a) => filter(key, value, i, a))
) as Record<K, V>;
