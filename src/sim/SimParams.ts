interface SimParams {
  readonly ac: number;
  readonly sm: number;
  readonly pb: number;
  readonly level: number;
}

export const createSimParams = (level: number, ac: number, smOffset: number): SimParams => ({
  ac,
  sm: ac - smOffset,
  pb: Math.floor((7 + level) / 4),
  level,
});

export default SimParams;
