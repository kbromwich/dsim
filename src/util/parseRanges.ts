import parseIntStrict from './parseIntStrict';
import { range } from './range';

const parsePositiveIntStrict = (value: string): number => {
  const num = parseIntStrict(value);
  return num >= 0 ? num : NaN;
};

/** Parse strings such as "1-5,7,9,11-20" into a list of (integer) values */
export default function parseRanges(...ranges: (string|string[])[]) {
  const values: number[] = [];
  ranges.flat().map((sr) => sr.split(',')).flat().forEach((rng) => {
    if (rng.includes("-")) {
      const [minlvl, maxlvl] = rng.split('-');
      const from = parsePositiveIntStrict(minlvl);
      const to = parsePositiveIntStrict(maxlvl);
      if (!Number.isNaN(from) && !Number.isNaN(to) && from <= to) {
        values.push(...range(from, to + 1));
      } else {
        values.push(NaN);
      }
    } else {
      values.push(parsePositiveIntStrict(rng));
    }
  })
  return [...new Set(values)];
}

/** Returns undefined if any part of range input is invalid */
export function tryParseRanges(...ranges: (string|string[])[]) {
  const values = parseRanges(...ranges);
  if (values.findIndex(Number.isNaN) >= 0) {
    return undefined;
  }
  return values;
}
