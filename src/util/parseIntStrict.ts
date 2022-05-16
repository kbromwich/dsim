
const parseIntStrict = (value: string): number => {
  const num = Number(value);
  const parsedInt = parseInt(value, 10);
  return (num === parsedInt) ? num : NaN;
};

export default parseIntStrict;
