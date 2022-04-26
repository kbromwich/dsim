import React from 'react';

import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import Simulation from 'sim/Simulation';

const CodeBlock = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1),
  whiteSpace: 'pre',
  backgroundColor: theme.palette.divider,
}));

const toggleSetItem = (nameSet: Set<string>, simName: string) => {
  const newSelected = new Set(nameSet);
  if (newSelected.has(simName)) {
    newSelected.delete(simName);
  } else {
    newSelected.add(simName)
  }
  return newSelected;
};

interface Props {
  sims: Record<string, Simulation[]>;
  selected: Set<string>;
  onSelectedChange: (sims: Set<string>) => void;
  onExpandedChange: (sims: Set<string>) => void;
  expandedSims: Set<string>;
}

const SelectorList: React.FC<Props> = ({ sims, selected, onSelectedChange, onExpandedChange, expandedSims }) => (
  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
    {Object.keys(sims).map((simName) => (
      <ListItem
        key={simName}
        disablePadding
      >
        <ListItemButton
          dense
          onClick={() => onSelectedChange(toggleSetItem(selected, simName))}
        >
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selected.has(simName)}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText
            primary={
              <>
                {simName}
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onExpandedChange(toggleSetItem(expandedSims, simName));
                  }}
                >
                  {expandedSims?.has(simName) ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </>
            }
            secondary={
              <Collapse in={expandedSims?.has(simName)} unmountOnExit>
                <CodeBlock>{
                  sims[simName].map((s) => s.simDefinition)
                    .filter((s, i, a) => s !== a[i - 1]).join('\n')
                }</CodeBlock>
              </Collapse>
            }
          />
        </ListItemButton>
      </ListItem>
    ))}
  </List>
);

export default SelectorList;
