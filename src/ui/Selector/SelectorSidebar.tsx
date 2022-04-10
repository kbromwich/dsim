import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { SelectorStateSet } from './SelectorState';

interface Props {
  selected: Set<string>;
  onSelectedChange: (sims: Set<string>) => void;
  selectStateSet: SelectorStateSet;
}

const SelectorSidebar: React.FC<Props> = ({ selectStateSet, selected, onSelectedChange }) => {
  const [state] = selectStateSet;
  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Button
        onClick={() => onSelectedChange(new Set(selected.size ? [] : Object.keys(state.parsedSims)))}
      >
        {selected.size ? 'Select None' : 'Select All'}
      </Button>
    </Box>
  );
};

export default SelectorSidebar;
