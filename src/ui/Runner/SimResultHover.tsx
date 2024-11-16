import React from 'react';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';

import { SharedState, useSharedState } from 'util/sharedState';
import { ResultHoverTarget } from './ResultHoverTarget';
import SimResultDetails from './SimResultDetails';
import SimResultComparison from './SimResultComparison';

const NoTouchPopper = styled(Popper)(({ theme }) => ({
  pointerEvents: 'none',
}));

interface Props {
 target: SharedState<ResultHoverTarget | undefined>;
}

const SimResultHover: React.FC<Props> = ({ target: targetShare }) => {
  const [show, setShow] = React.useState(false);
  const [target, setTarget] = React.useState<ResultHoverTarget>();
  const [sharedTarget] = useSharedState(targetShare);
  React.useEffect(() => {
    if (sharedTarget) {
      setTarget(sharedTarget);
      setShow(true);
    } else {
      setShow(false);
    }
  }, [sharedTarget]);
  return (
    <NoTouchPopper
      anchorEl={target?.element}
      keepMounted
      placement='bottom'
      open={show && !!target?.element}
    >
      {target && 'simResult' in target && target.simResult.finished && target.simResult.stats && (
        <Paper elevation={6}>
          <SimResultDetails simResult={target.simResult} />
        </Paper>
      )}
      {target && 'simResults' in target && (
        <Paper elevation={6}>
          <SimResultComparison simResults={target.simResults} title={target.title} />
        </Paper>
      )}
    </NoTouchPopper>
  );
};

export default SimResultHover;
