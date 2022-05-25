import React from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { ParsedSims } from 'ui/useParsedSims';
import { SelectorStateSet } from './SelectorState';
import search from './search';
import SelectorList from './SelectorList';

interface Props {
  sims: ParsedSims;
  selected: Set<string>;
  onSelectedChange: (sims: Set<string>) => void;
  selectStateSet: SelectorStateSet;
}

const Selector: React.FC<Props> = ({ sims, selected, onSelectedChange, selectStateSet }) => {
  const [state, setState] = selectStateSet;
  const searchedNames = search(state.search, sims.names, state.searchCaseInsensitive);
  const searchSel = searchedNames.filter((n) => selected.has(n));
  const allSearchSel = searchSel.length === searchedNames.length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', pt: 1, flexGrow: 0, }}>
        <Checkbox
          checked={!!searchSel.length && allSearchSel}
          indeterminate={!!searchSel.length && !allSearchSel}
          onClick={() => {
            if (searchSel.length) {
              onSelectedChange(new Set([...selected].filter((n) => !searchSel.includes(n))));
            } else {
              onSelectedChange(new Set([...selected, ...searchedNames]));
            }
          }}
          sx={{ px: 1.6, mr: 2 }}
          tabIndex={-1}
          title="Select / deselect all"
        />
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: !!state.search && (
              <InputAdornment position="end">
                <IconButton onClick={() => setState({ search: '' })}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          onChange={(e) => setState({ search: e.target.value })}
          value={state.search}
        />
      </Box>
      <SelectorList
        sims={sims.sims}
        selected={selected}
        searched={new Set(searchedNames)}
        onSelectedChange={onSelectedChange}
      />
    </Box>
  );
};

export default Selector;
