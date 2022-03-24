import React from 'react';
import throttle from 'lodash.throttle';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import WorkerPool from 'worker/WorkerPool';
import { combineStats } from 'sim/Stats';
import { tryParseTestSimDef } from 'sim/parse';
import SimResult from 'sim/SimResult';
import { createSimConfig } from 'sim/SimConfig';
import SimResultsTable from './SimResultsTable';
import SimRun, { SimProgress } from './SimRun';
import Timer from './Timer';
import { Typography } from '@mui/material';
import cleanSimsText from 'util/cleanSimsText';

interface Props {
  acValues: number[];
  iterations: number;
  rawSimDefs: string[];
}

interface State {
  status: 'running' | 'errored' | 'completed' | 'init' | 'canceled';
  onStop?: () => void;
  time: number;
  results: SimRun[];
  errors: string[];
  iterations: number;
}

const SimList: React.FC<Props> = ({ acValues, iterations, rawSimDefs }) => {
  const [state, setState] = React.useState<State>({
    status: 'init',
    onStop: undefined,
    time: 0,
    results: [],
    errors: [],
    iterations,
  });
  const stateRef = React.useRef<{ state: State; setState: typeof setState }>();
  stateRef.current = { state, setState };
  const setSomeState = (some: Partial<State>) => (
    stateRef.current?.setState((curState: State) => ({ ...curState, ...some }))
  );
  const isRunning = state.status === 'running';
  const hasRun = !isRunning && state.status !== 'init';

  const runSims = async () => {
    const startTime = +new Date();
    const pool = new WorkerPool(8);
    setSomeState({
      status: 'running',
      time: startTime,
      onStop: () => pool.terminate(),
      iterations,
    });
    
    const parseErrors: string[] = [];
    const runs: SimRun[] = cleanSimsText(rawSimDefs).map((rawSimDef): SimRun[] => {
      try {
        return tryParseTestSimDef(rawSimDef).map((sim) => acValues.map((ac) => ({
          simulation: sim,
          simConfig: createSimConfig(sim.level, ac),
          maxProgress: 0,
          minProgress: 0,
          updateCount: 0,
          error: sim.error,
        }))).flat();
      } catch (e) {
        console.error(`Error parsing simulation defintion "${rawSimDef}": ${e}`, e);
        parseErrors.push(`Error parsing "${rawSimDef}": ${e}`);
        return [];
      }
    }).flat();
    setSomeState({ errors: parseErrors });

    for (let i = 0; i < runs.length; i += 1) {
      const run = runs[i] as SimProgress;
      if (run.error) {
        continue;
      }
      try {
        const workerConfig = {
          expression: run.simulation.rawExpression,
          config: run.simConfig,
        };
        const onProgress = throttle((max: number, min: number) => {
          if ('maxProgress' in run) {
            run.maxProgress = max;
            run.minProgress = min;
            run.updateCount += 1;
            setSomeState({ results: runs });
          }
        }, 20, { leading: true });
        const result = await pool.run(workerConfig, iterations, onProgress);
        runs[i] = new SimResult(run.simulation, run.simConfig, combineStats(result));
      } catch (e) {
        run.error = String(e);
        if (run.error === 'Terminated') {
          run.error = 'Cancelled by user';
        }
      }
      if (pool.isTerminated()) {
        break;
      }
    }

    setSomeState({
      results: runs,
      status: pool.isTerminated() ? 'canceled' : 'completed',
      time: +new Date() - startTime,
    });
  };

  return (
    <Box sx={{ flexBasis: '64%', flex: 1, padding: 1 }}>
      <Button
        color="primary"
        onClick={isRunning ? state.onStop : runSims}
      >
        {!isRunning && 'Run Simulation!'}
        {isRunning && 'Stop Simulation!'}
      </Button>
      {!!state.results.length && (
        <>
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
          <SimResultsTable results={state.results} acValues={acValues} />
        </>
      )}
    </Box>
  );
};

export default SimList;
