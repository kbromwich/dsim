import { range } from './range';

const parseIntStrict = (value: any): number => {
  const num = Number(value);
  const parsedInt = parseInt(value, 10);
  return num === parsedInt ? num : NaN;
};

/** Parse strings such as "1-5,7,9,11-20" into a list of (integer) values */
export default function parseRanges(...ranges: (string|string[])[]) {
  const values: number[] = [];
  ranges.flat().map((sr) => sr.split(',')).flat().forEach((rng) => {
    if (rng.includes("-")) {
      const [minlvl, maxlvl] = rng.split('-');
      values.push(...range(parseIntStrict(minlvl), parseIntStrict(maxlvl) + 1));
    } else {
      values.push(parseIntStrict(rng));
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
