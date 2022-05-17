class Distribution {
  protected map: Map<number, number>;
  protected sumTotal: number;

  constructor(entries?: [number, number][]) {
    this.map = new Map(entries);
    this.sumTotal = (entries || []).reduce((sum, [, count]) => sum + count, 0);
  }

  uniqueCount() {
    return this.map.size;
  }

  totalCount() {
    return this.sumTotal;
  }

  entries() {
    return [...this.map.entries()];
  }

  uniqueValues() {
    return [...this.map.keys()];
  }

  static merge(...dists: Distribution[]) {
    const merged = new Distribution();
    const m = merged.map;
    dists.forEach((dist) => {
      dist.map.forEach((c, v) => m.set(v, (m.get(v) || 0) + c));
      merged.sumTotal += dist.sumTotal;
    });
    return merged;
  }
}

export class MutableDistribution extends Distribution {
  increment(value: number) {
    this.map.set(value, (this.map.get(value) || 0) + 1);
    this.sumTotal += 1;
  }

  toImmutable() {
    return new Distribution(this.entries());
  }
}

export default Distribution;
