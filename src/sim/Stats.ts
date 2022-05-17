import Distribution from 'util/Distribution';

export interface Stats {
  count: number;
  min: number;
  max: number;
  mean: number;
  stdev: number;
}

export default function calculateStats(dist: Distribution): Stats {
  if (!dist.totalCount()) throw Error('Cannot calculate stats for empty array');
  const entries = dist.entries();
  const sum = entries.reduce((sum, [value, count]) => sum + (value * count), 0);
  const mean = sum / dist.totalCount();
  const uniqueValues = dist.uniqueValues();
  return {
    count: dist.totalCount(),
    min: Math.min(...uniqueValues),
    max: Math.max(...uniqueValues),
    mean,
    stdev: Math.sqrt(entries.reduce((sum, [value, count]) => (
      sum + (((value - mean) ** 2) * count)
    ), 0) / (dist.totalCount() - 1)),
  };
};
