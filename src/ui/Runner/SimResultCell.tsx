import React from 'react';

import { styled } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

import SimRun from './SimRun';

const ProgressContainer = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  position: 'relative'
}));

const NoTransitionProgress = styled(LinearProgress)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  margin: 'auto 0',
  width: '100%',
  // overflow: 'visible',
  '& .MuiLinearProgress-bar': {
    transition: 'none',
  },
  '&.mean': {
    width: 'calc(100% + 7.5px)',
  },
  '&.stdev': {
    width: 'calc(100% + 7.5px)',
    marginLeft: '-7.5px',
  },
}));


interface Props {
  sim?: SimRun;
  stat: 'mean' | 'stdev';
}
const SimResultCell: React.FC<Props> = ({ sim, stat }) => {
  const [, setCount] = React.useState(0);
  React.useEffect(() => {
    const observer = (sim: SimRun) => {
      setCount((c) => c + 1)
      if (sim?.finished) {
        sim.removeObserver(observer);
      }
    };
    sim?.addObserver(observer);
    return () => sim?.removeObserver(observer);
  }, [sim]);
  if (sim) {
    if (sim.finished && sim.stats && stat === 'mean') {
      return <span>{sim.stats.mean.toFixed(2)}</span>;
    } else if (sim.finished && sim.stats && stat === 'stdev') {
      return <span>{sim.stats.stdev.toFixed(2)}</span>;
    } else if (sim.finished && sim.error) {
      return <span title={sim.error}>Error</span>;
    } else if (sim.maxProgress) {
      let offset = stat === 'stdev' ? -0.5 : 0; // Hack to make two across stdev and mean look like one
      return (
        <ProgressContainer>
          <NoTransitionProgress
            className={stat}
            value={Math.min(100, (sim.minProgress + offset) * 200)}
            valueBuffer={Math.min(100, (sim.maxProgress + offset) * 200)}
            variant="buffer"
          />
        </ProgressContainer>
      );
    }
  }
  return <span></span>;
};

export default SimResultCell;
