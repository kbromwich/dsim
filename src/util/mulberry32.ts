/**
 * Creates a (pseudo) random number generating function from a seed.
 * From https://stackoverflow.com/a/47593316/4246649
 **/
export default function mulberry32(seed: number): () => number {
  return function() {
    var t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
