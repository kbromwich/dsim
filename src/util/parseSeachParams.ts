const parseSearchParams = (): Record<string, string> => {
  const result: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  [...params.entries()].forEach(([key, value]) => {
    result[key] = value;
  });
  return result;
};

export default parseSearchParams;
