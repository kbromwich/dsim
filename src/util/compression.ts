import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';

const ToSafeTransform: NodeJS.Dict<string> = {
  '+': '-',
  '/': '_',
  '=': '.'
}
const FromSafeTransform: NodeJS.Dict<string> = {
  '-': '+',
  '_': '/',
  '.': '='
}

const toUrlSafeB64 = (rawB64: string) => {
  return rawB64.replace(/[+/=]/g, (m) => ToSafeTransform[m] || m)
}

const fromUrlSafeB64 = (safeB64: string) => {
  return safeB64.replace(/[-_.]/g, (m) => FromSafeTransform[m] || m)
}

export const compressForUrl = (toCompress: string) => {
  const compressed = deflateSync(strToU8(toCompress), { level: 9 });
  return toUrlSafeB64(btoa(strFromU8(compressed, true)));
};
  
export const decompressFromUrl = (urlB64: string) => {
  const compressed = strToU8(atob(fromUrlSafeB64(urlB64)), true);
  return strFromU8(inflateSync(compressed));
};
