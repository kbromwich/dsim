import React from 'react';
import throttle from 'lodash.throttle';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';

import { combineStats } from 'sim/Stats';
import { tryParseTestSimDef } from 'sim/parse';
import { createSimParams } from 'sim/SimParams';
import SimResult from 'sim/SimResult';
import buildUrl from 'util/buildUrl';
import cleanSimsText from 'util/cleanSimsText';
import WorkerPool from 'worker/WorkerPool';

import SimResultsTable from './SimResultsTable';
import SimRun, { SimProgress } from './SimRun';
import Timer from './Timer';
import { compressForUrl } from 'util/compression';
import { tryParseRanges } from 'util/parseRanges';

interface Props {
  rawAcValues: string;
  iterations: number;
  rawLevels: string;
  rawSimDefs: string[];
  workers: number;
}

interface State {
  status: 'running' | 'errored' | 'completed' | 'init' | 'canceled';
  onStop?: () => void;
  time: number;
  results: SimRun[];
  errors: string[];
  iterations: number;
  acValues: number[];
  rawAcValues: string;
  rawLevels: string;
  compressedSimDefs: string
}

const SimList: React.FC<Props> = ({ rawAcValues, iterations, rawLevels, rawSimDefs, workers }) => {
  const acValues = tryParseRanges(rawAcValues) || [];
  const levels = tryParseRanges(rawLevels) || [];
  const [runState, setRunState] = React.useState<State>({
    status: 'init',
    onStop: undefined,
    time: 0,
    results: [],
    errors: [],
    iterations,
    acValues,
    rawAcValues,
    rawLevels,
    compressedSimDefs: '',
  });
  const stateRef = React.useRef<{ state: State; setState: typeof setRunState }>();
  stateRef.current = { state: runState, setState: setRunState };
  const setSomeState = (some: Partial<State>) => (
    stateRef.current?.setState((curState: State) => ({ ...curState, ...some }))
  );
  const isRunning = runState.status === 'running';
  const hasRun = !isRunning && runState.status !== 'init';

  const runSims = async () => {
    const startTime = +new Date();
    const pool = new WorkerPool(workers);
    setSomeState({
      status: 'running',
      time: startTime,
      onStop: () => pool.terminate(),
      iterations,
      acValues,
      compressedSimDefs: compressForUrl(rawSimDefs.join('\n')),
    });
    
    const parseErrors: string[] = [];
    const runs: SimRun[] = cleanSimsText(rawSimDefs).map((rawSimDef): SimRun[] => {
      try {
        const sims = tryParseTestSimDef(rawSimDef)
          .filter((s) => levels.includes(s.level));
        return sims.map((sim) => acValues.map((ac) => ({
          simulation: sim,
          simParams: createSimParams(sim.level, ac),
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
          config: run.simParams,
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
        runs[i] = new SimResult(run.simulation, run.simParams, combineStats(result));
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          color="primary"
          disabled={!levels.length || !acValues.length || !iterations}
          onClick={isRunning ? runState.onStop : runSims}
        >
          {!isRunning && 'Run Simulation!'}
          {isRunning && 'Stop Simulation!'}
        </Button>
        {runState.compressedSimDefs && (
          <Typography sx={{ fontStyle: 'italic' }} variant="body2">
            <a href={buildUrl({
              acValues: runState.rawAcValues,
              levels: runState.rawLevels,
              sims: runState.compressedSimDefs,
            })}>Perma-link to this simulation</a>
          </Typography>
        )}
      </Box>
      {!!runState.results.length && (
        <>
          {isRunning && (
            <Typography variant="body1">
              Simulations have been running for&nbsp;
              <Timer startTime={new Date(runState.time)}/>&nbsp;
              seconds ({runState.iterations} iterations each).
            </Typography>
          )}
          {hasRun && (
            <Typography variant="body1">
              Simulations {runState.status} after {(runState.time / 1000).toFixed(1)} seconds ({runState.iterations} iterations each).
            </Typography>
          )}
          {runState.errors.map((error) => <Typography key={error}>{error}</Typography>)}
          <SimResultsTable results={runState.results} acValues={runState.acValues} />
        </>
      )}
    </Box>
  );
};

export default SimList;
