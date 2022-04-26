import React from 'react';

import { tryParseTestSimDef } from 'sim/parse';
import Simulation from 'sim/Simulation';
import { arrayBinned } from 'util/arrays';
import cleanSimsText from 'util/cleanSimsText';

export interface ParsedSims {
  readonly sims: Record<string, Simulation[]>;
  readonly names: string[];
  readonly errors: string[];
}

export const useParsedSims = (rawSims: string): ParsedSims => {
  const [sims, setSims] = React.useState<ParsedSims>({
    sims: {},
    errors: [],
    names: [],
  });
  React.useEffect(() => {
    const errors: string[] = [];
    const sims = arrayBinned(cleanSimsText(rawSims.split('\n')).map((sim): Simulation[] => {
      try {
        return tryParseTestSimDef(sim);
      } catch (e) {
        console.error(`Error parsing simulation defintion "${sim}": ${e}`, e);
        errors.push(`Error parsing "${sim}": ${e}`);
        return [];
      }
    }).flat(), (sim) => sim.name);
    setSims({ sims, errors, names: Object.keys(sims) });
  }, [rawSims, setSims]);
  return sims;
};
