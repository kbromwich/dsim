import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import SimConfig from 'sim/SimConfig';
import { tryParseRanges } from 'util/parseRanges';
import buildUrl from 'util/buildUrl';

import SimConfiguration from 'ui/SimConfiguration';
import { RunnerState, RunnerStateSet } from './RunnerState';
import runSims from './runSims';

interface Props {
  rawSims: string;
  selected: Set<string>;
  config: SimConfig;
  onConfigChange: (config: SimConfig) => void;
  runStateSet: RunnerStateSet;
}

const RunnerSidebar: React.FC<Props> = ({ rawSims, selected, config, onConfigChange, runStateSet }) => {
  const [state] = runStateSet;
  const acValues = tryParseRanges(config.acValues) || [];
  const levels = tryParseRanges(config.levels) || [];
  const iterations = config.iterations;

  const stateRef = React.useRef<RunnerStateSet>();
  stateRef.current = runStateSet;
  const setSimSetRunState = (newState: Partial<RunnerState>) => (
    stateRef.current?.[1](newState)
  );

  const isRunning = state.status === 'running';
  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Button
        color="primary"
        disabled={!levels.length || !acValues.length || !iterations}
        onClick={() => {
          if (isRunning) {
            state.onStop?.();
          } else {
            runSims(rawSims, config, selected, setSimSetRunState);
          }
        }}
      >
        {!isRunning && 'Run Simulation!'}
        {isRunning && 'Stop Simulation!'}
      </Button>
      {state?.compressedSimDefs && (
        <Typography sx={{ fontStyle: 'italic' }} variant="body2">
          <a href={buildUrl({
            acValues: state.rawAcValues,
            levels: state.rawLevels,
            sims: state.compressedSimDefs,
          })}>Perma-link to this simulation</a>
        </Typography>
      )}
      <SimConfiguration
        config={config}
        onChange={onConfigChange}
      />
    </Box>
  );
};

export default RunnerSidebar;
