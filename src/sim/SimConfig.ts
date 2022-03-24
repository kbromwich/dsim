interface SimConfig {
  readonly ac: number;
  readonly sm: number;
  readonly pb: number;
  readonly level: number;
}

export const createSimConfig = (level: number, ac: number): SimConfig => ({
  ac,
  sm: ac - 10,
  pb: Math.floor((7 + level) / 4),
  level,
});

export default SimConfig;
