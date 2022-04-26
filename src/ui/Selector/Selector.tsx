import React from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { ParsedSims } from 'ui/useParsedSims';
import { SelectorStateSet } from './SelectorState';
import search from './search';
import SelectorList from './SelectorList';
import { objectFilter } from 'util/objects';

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
  const nonSearchSelSims = objectFilter(sims.sims, (name) => (
    selected.has(name) && !searchedNames.includes(name)
  ));

  return (
    <Box>
      <Box sx={{ display: 'flex', pt: 1 }}>
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
        sims={objectFilter(sims.sims, (name) => searchedNames.includes(name))}
        selected={selected}
        onSelectedChange={onSelectedChange}
        onExpandedChange={(names) => setState({ expandedSims: names })}
        expandedSims={state.expandedSims}
      />
      {!!Object.keys(nonSearchSelSims).length && (
        <>
        <Divider sx={{ mx: 2, maxWidth: 600 }} />
          {/* <Box sx={{ display: 'flex' }}>
            <Checkbox
              checked={!!selected.size && allSelected}
              indeterminate={!!selected.size && !allSelected}
              onClick={() => {
                if (selected.size) {
                  onSelectedChange(new Set());
                } else {
                  onSelectedChange(new Set(sims.names));
                }
              }}
              sx={{ px: 1.6, mr: 2 }}
              tabIndex={-1}
              title="Select / deselect all"
            />
          </Box> */}
          <Typography sx={{ mx: 2, mt: 2, fontStyle: 'italic' }} variant="body2">
            The following simulations are currently selected but don't match the search:
          </Typography>
          <SelectorList
            sims={nonSearchSelSims}
            selected={selected}
            onSelectedChange={onSelectedChange}
            onExpandedChange={(names) => setState({ expandedSims: names })}
            expandedSims={state.expandedSims}
          />
        </>
      )}
    </Box>
  );
};

export default Selector;
