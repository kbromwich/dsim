export interface Stats {
  count: number;
  min: number;
  max: number;
  mean: number;
  // squareMean: number;
  stdev: number;
}

export function combineStats(stats: Stats[]): Stats {
  const count = stats.reduce((prev, curr) => prev + curr.count, 0);
  const min = Math.min(...stats.map((s) => s.min));
  const max = Math.max(...stats.map((s) => s.max));
  const mean = stats.reduce((prev, curr) => prev + (curr.count * curr.mean), 0) / count;
  // const squareMean = stats.reduce((prev, curr) => prev + curr.squareMean, 0);
  // const stdev = Math.sqrt((squareMean / count) - (mean * mean)),
  const stdevStats = stats.filter((s) => s.count > 1);
  const stdev = Math.sqrt(stdevStats.reduce((prev, curr) => prev + (curr.count * (curr.stdev ** 2)), 0) / count);
  return {
    count,
    min,
    max,
    mean,
    // squareMean,
    stdev,
  };
};

export default function calculateStats(values: number[]): Stats {
  if (!values.length) throw Error('Cannot calculate stats for empty array');
  const mean = values.reduce((s, n) => s + n) / values.length;
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    // squareMean: values.reduce((s, n) => s + (n * n), 0),
    stdev: Math.sqrt(values.reduce((s, n) => s + (n - mean) ** 2, 0) / (values.length - 1)),
  };
};
