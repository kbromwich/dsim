import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import SimConfig from 'sim/SimConfig';
import { parseRawDynamicACs } from 'sim/DynamicAC';
import { tryParseRanges } from 'util/parseRanges';
import buildUrl from 'util/buildUrl';

import { ParsedSims } from 'ui/useParsedSims';
import SimConfiguration from 'ui/SimConfiguration';
import { RunnerState, RunnerStateSet } from './RunnerState';
import runSims from './runSims';
import parseIntStrict from 'util/parseIntStrict';

interface Props {
  sims: ParsedSims;
  selected: Set<string>;
  config: SimConfig;
  onConfigChange: (config: SimConfig) => void;
  runStateSet: RunnerStateSet;
}

const RunnerSidebar: React.FC<Props> = ({ sims, selected, config, onConfigChange, runStateSet }) => {
  const [state] = runStateSet;
  const acValues = tryParseRanges(config.acValues) || [];
  const dacValues = parseRawDynamicACs(config.dynamicAc) || [];
  const smOffset = parseIntStrict(config.saveModOffset);
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
      <SimConfiguration
        config={config}
        onChange={onConfigChange}
      />
      <Button
        color="primary"
        disabled={
          !levels.length
          || (!acValues.length && !dacValues.length)
          || !iterations
          || Number.isNaN(smOffset)
        }
        onClick={() => {
          if (isRunning) {
            state.onStop?.();
          } else {
            runSims(sims, config, selected, setSimSetRunState);
          }
        }}
      >
        {!isRunning && 'Run Simulation!'}
        {isRunning && 'Stop Simulation!'}
      </Button>
      {state?.compressedSimDefs && (
        <Typography sx={{ fontStyle: 'italic' }} variant="body2">
          <a href={buildUrl({
            ac: state.rawAcValues,
            dac: state.rawDynamicAc,
            lvl: state.rawLevels,
            smo: state.rawSaveModOffset,
            sims: state.compressedSimDefs,
          })}>Perma-link to this simulation</a>
        </Typography>
      )}
    </Box>
  );
};

export default RunnerSidebar;
