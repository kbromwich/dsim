import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';

import Simulation from 'sim/Simulation';
import SelectorItem, { SelectorItemHeight } from './SelectorItem';

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
  searched?: Set<string>;
  selected: Set<string>;
  onSelectedChange: (sims: Set<string>) => void;
}

const SelectorList: React.FC<Props> = ({ sims, searched, selected, onSelectedChange }) => {
  const simNames = Object.keys(sims);
  const primaryNames: string[] = [];
  const secondaryNames: string[] = [];
  simNames.forEach((simName) => {
    if (!searched || searched.has(simName)) {
      primaryNames.push(simName);
    } else if(selected.has(simName)) {
      secondaryNames.push(simName);
    }
  });
  const numExtras = secondaryNames.length ? secondaryNames.length + 1 : 0;
  
  const Row = ({ index, style }: ListChildComponentProps) => {
    let simName: string;
    if (index < primaryNames.length) {
      simName = primaryNames[index];
    } else if (index > primaryNames.length) {
      simName = secondaryNames[index - (primaryNames.length + 1)];
    } else {
      return (
        <ListItem
          key="nonSearchSelBreak"
          style={style}
          sx={{ height: SelectorItemHeight }}
        >
          <Typography sx={{ mx: 2, mt: 2, fontStyle: 'italic' }} variant="body2">
            The following simulations are currently selected but don't match the search:
          </Typography>
        </ListItem>
      );
    }
    return (
      <SelectorItem
        sims={sims[simName]}
        style={style}
        selected={selected.has(simName)}
        onToggle={() => onSelectedChange(toggleSetItem(selected, simName))}
      />
    );
  };

  return (
    <Box sx={{ flex: '1 1 auto' }}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            itemCount={primaryNames.length + numExtras}
            itemSize={SelectorItemHeight}
            width={width}
            itemData
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </Box>
  );
};

export default SelectorList;
