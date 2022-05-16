enum DynamicAC {
  /** Standard Build, Chance to Hit: 65% */
  SBCTH65 = 'SBCTH65',
}

export const parseRawDynamicACs = (rawDynamicAc: string): DynamicAC[] => {
  return rawDynamicAc.split(',').filter((x) => x in DynamicAC) as DynamicAC[];
}

interface DynamicACDatum {
  calculate: (level: number) => number;
  displayName: string;
  description: string;
}

const SBCTH65_AC = [
  13, 13, 13, 14, 15, 15, 15, 16, 17, 17,
  17, 17, 18, 18, 18, 18, 19, 19, 19, 19,
];

export const DynamicACData: Record<DynamicAC, DynamicACDatum> = {
  [DynamicAC.SBCTH65]: {
    calculate: (level) => SBCTH65_AC[Math.max(1, Math.min(20, level)) - 1],
    displayName: 'SHC 65%',
    description: `"Standard Hit Chance": Level dependant AC calculated to be a
65% chance to hit for a "standard build" at that level. ("standard build":
primary stat 16 at level 1, 18 at level 4, 20 and level 8)
Level => AC
${SBCTH65_AC.map((v, i) => `${i + 1} => ${v}`).join('\n')}
`,
  },
};

export default DynamicAC;
