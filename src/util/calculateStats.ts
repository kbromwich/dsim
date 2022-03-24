export interface Stats {
  min: number;
  max: number;
  mean: number;
  stdev: number;
}

export default function calculateStats(values: number[]): Stats {
  if (!values.length) throw Error('Cannot calculate stats for empty array');
  const mean = values.reduce((s, n) => s + n) / values.length;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    stdev: Math.sqrt(values.reduce((s, n) => s + (n - mean) ** 2, 0) / (values.length - 1)),
  };
};
