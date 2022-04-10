import React from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import SearchIcon from '@mui/icons-material/Search';

import { SelectorStateSet } from './SelectorState';

interface Props {
  selected: Set<string>;
  onSelectedChange: (sims: Set<string>) => void;
  selectStateSet: SelectorStateSet;
}

const Selector: React.FC<Props> = ({ selected, onSelectedChange, selectStateSet }) => {
  const [state, setState] = selectStateSet;

  const toggleSimSelected = (simName: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(simName)) {
      newSelected.delete(simName);
    } else {
      newSelected.add(simName)
    }
    onSelectedChange(newSelected);
  };

  const searchedNames = Object.keys(state.parsedSims).filter((simName) => {
    const name = state.searchCaseInsensitive ? simName.toLowerCase() : simName;
    return name.includes(state.search);
  });

  return (
    <Box sx={{ flexBasis: '33%', padding: 1 }}>
      <TextField
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        onChange={(e) => setState({ search: e.target.value })}
        value={state.search}
      />
      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        {searchedNames.map((simName) => (
          <ListItem
            key={simName}
            // secondaryAction={
            //   <IconButton edge="end" aria-label="comments">
            //     <CommentIcon />
            //   </IconButton>
            // }
            disablePadding
          >
            <ListItemButton onClick={() => toggleSimSelected(simName)} dense>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selected.has(simName)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText primary={simName} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Selector;
