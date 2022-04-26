import React from 'react';
import { ParsedSims } from 'ui/useParsedSims';

export interface SelectorState {
  search: string;
  searchCaseInsensitive: boolean;
  expandedSims: Set<string>;
}

export type SelectorStateSet = [SelectorState, (newState: Partial<SelectorState>) => void];

export const useSelectorState = (
  sims: ParsedSims,
  selected: Set<string>,
  onSelectedChange: (sims: Set<string>) => void,
): SelectorStateSet => {
  const [state, setState] = React.useState<SelectorState>({
    search: '',
    searchCaseInsensitive: true,
    expandedSims: new Set(),
  });
  React.useEffect(() => {
    const cleaned = Object.keys(sims.sims).filter((name) => selected.has(name));
    onSelectedChange(new Set(cleaned));

  // We ONLY want to trigger when sims changes!
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sims]);
  return [state, (newState: Partial<SelectorState>) => {
    setState((curState) => ({ ...curState, ...newState }));
  }];
};
