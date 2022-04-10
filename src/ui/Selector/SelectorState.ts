import React from 'react';
import { tryParseTestSimDef } from 'sim/parse';
import Simulation from 'sim/Simulation';
import { arrayBinned } from 'util/arrays';
import cleanSimsText from 'util/cleanSimsText';

export interface SelectorState {
  parsedSims: Record<string, Simulation[]>;
  search: string;
  searchCaseInsensitive: boolean;
}

export type SelectorStateSet = [SelectorState, (newState: Partial<SelectorState>) => void];

export const useSelectorState = (sims: string): SelectorStateSet => {
  const [state, setState] = React.useState<SelectorState>({
    parsedSims: {},
    search: '',
    searchCaseInsensitive: true,
  });
  React.useEffect(() => {
    const parseErrors: string[] = [];
    const parsed = arrayBinned(cleanSimsText(sims.split('\n')).map((sim): Simulation[] => {
      try {
        return tryParseTestSimDef(sim);
      } catch (e) {
        console.error(`Error parsing simulation defintion "${sim}": ${e}`, e);
        parseErrors.push(`Error parsing "${sim}": ${e}`);
        return [];
      }
    }).flat(), (sim) => sim.name);
    setState((curState) => ({ ...curState, parsedSims: parsed }));
  }, [sims, setState]);
  return [state, (newState: Partial<SelectorState>) => {
    setState((curState) => ({ ...curState, ...newState }));
  }];
};
