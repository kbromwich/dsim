interface SimParams {
  readonly ac: number;
  readonly sm: number;
  readonly pb: number;
  readonly level: number;
}

export const createSimParams = (level: number, ac: number): SimParams => ({
  ac,
  sm: ac - 10,
  pb: Math.floor((7 + level) / 4),
  level,
});

export default SimParams;
