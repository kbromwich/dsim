import { range } from './range';

/** Parse strings such as "1-5,7,9,11-20" into a list of (integer) values */
export default function parseRanges(str_ranges: string[]) {
  const values: number[] = [];
  const ranges = str_ranges.map((sr) => sr.split(',')).flat();
  ranges.forEach((rng) => {
    if (rng.includes("-")) {
      const [minlvl, maxlvl] = rng.split('-');
      values.push(...range(parseInt(minlvl, 10), parseInt(maxlvl, 10) + 1));
    } else {
      values.push(parseInt(rng, 10));
    }
  })
  return [...new Set(values)];
}
