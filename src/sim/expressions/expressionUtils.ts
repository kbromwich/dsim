const NoPF = () => ({});
const NoMax = 999;

let randomFunction = Math.random;
const sum = (values: number[]) => values.reduce((prev, cur) => prev + cur, 0);
const roll = (die: number) => Math.floor(randomFunction() * die) + 1;

export const exportedForTesting = {
  setRandomFunction: (func: () => number) => randomFunction = func,
};

const expressionUtils = { NoPF, NoMax, sum, roll };

export default expressionUtils;
