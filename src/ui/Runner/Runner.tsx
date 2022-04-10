import React from 'react';

import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

import SimConfig from 'sim/SimConfig';

import Timer from 'ui/Timer';
import SimResultsTable from './SimResultsTable';
import { RunnerStateSet } from './RunnerState';

interface Props {
  rawSims: string;
  config: SimConfig;
  selected: Set<string>;
  runStateSet: RunnerStateSet;
}

const Runner: React.FC<Props> = ({ rawSims, config, selected, runStateSet }) => {
  const [state] = runStateSet;
  const isRunning = state.status === 'running';
  const hasRun = !isRunning && state.status !== 'init';

  
  return (
    <Box sx={{ padding: 1 }}>
      {!!state.results.length && (
        <>
          <SimResultsTable
            acValues={state.acValues}
            results={state.results}
            fastRender={isRunning}
            showExpressions
          />
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
          {state.errors.map((error) => <Typography key={error}>{error}</Typography>)}
        </>
      )}
    </Box>
  );
};

export default Runner;
