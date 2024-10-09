import React from 'react';

import { parseSimDefsScript } from 'sim/parse';
import { ParsedSims } from 'sim/ParsedSims';

export const useParsedSims = (rawSims: string): ParsedSims => {
  const [sims, setSims] = React.useState<ParsedSims>({
    sims: {},
    errors: [],
    names: [],
  });
  React.useEffect(() => {
    setSims(parseSimDefsScript(rawSims));
  }, [rawSims, setSims]);
  return sims;
};
