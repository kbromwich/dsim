import React from 'react';

import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

import Timer from 'ui/Timer';
import SimResultsTable from './SimResultsTable';
import { RunnerStateSet } from './RunnerState';

interface Props {
  runStateSet: RunnerStateSet;
}

const Runner: React.FC<Props> = ({ runStateSet }) => {
  const [state] = runStateSet;
  const isRunning = state.status === 'running';
  const hasRun = !isRunning && state.status !== 'init';
  
  return (
    <Box sx={{ padding: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!!state.results.length && (
        <>
          <Box sx={{ flexGrow: 1 }}>
            <SimResultsTable
              acValues={state.acValues}
              dynamicACs={state.dynamicACs}
              results={state.results}
            noSort={isRunning}
              showExpressions
            />
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            {isRunning && (
              <Typography variant="body1">
                Simulations have been running for&nbsp;
                <Timer startTime={new Date(state.time)}/>&nbsp;
                seconds ({state.iterations} iterations each).
              </Typography>
            )}
            {hasRun && (
              <Typography variant="body1">
                Simulations {state.status} after {(state.time / 1000).toFixed(1)} seconds ({state.iterations} iterations each).
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Runner;
