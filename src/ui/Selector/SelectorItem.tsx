import React from 'react';

import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';

import Simulation from 'sim/Simulation';
import CodeBlock from 'ui/CodeBlock';

export const SelectorItemHeight = 40;

const FixedHeightListItem = styled(ListItem)(({ theme }) => ({
  height: SelectorItemHeight,
}));
const FixedHeightItemButton = styled(ListItemButton)(({ theme }) => ({
  height: SelectorItemHeight,
  paddingTop: 0,
  paddingBottom: 0,
}));
const NoTouchPopper = styled(Popper)(({ theme }) => ({
  pointerEvents: 'none',
}));

interface Props {
  sims: Simulation[];
  selected: boolean;
  style: React.CSSProperties;
  onToggle: () => void;
}

const SelectorItem: React.FC<Props> = ({ sims, selected, style, onToggle }) => {
  const [hover, setHover] = React.useState(false)
  const ref = React.useRef<HTMLLIElement>(null);
  const simName = sims[0].name;
  return (
    <FixedHeightListItem
      key={simName}
      disablePadding
      style={style}
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <FixedHeightItemButton
        dense
        onClick={onToggle}
      >
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={selected}
            tabIndex={-1}
            disableRipple
          />
        </ListItemIcon>
        <ListItemText primary={<Typography>{simName}</Typography>} />
      </FixedHeightItemButton>
      {hover && (
        <NoTouchPopper
          anchorEl={ref.current}
          keepMounted
          placement='bottom-start'
          open={hover}
        >
          <Paper elevation={6} sx={{ ml: 16 }}>
            <CodeBlock>{
              sims.map((s) => s.source.definition)
                .filter((s, i, a) => s !== a[i - 1]).join('\n')
            }</CodeBlock>
          </Paper>
        </NoTouchPopper>
      )}
    </FixedHeightListItem>
  );
};

export default SelectorItem;
