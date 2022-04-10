import throttle from 'lodash.throttle';

import { combineStats } from 'sim/Stats';
import { tryParseTestSimDef } from 'sim/parse';
import { createSimParams } from 'sim/SimParams';
import SimResult from 'sim/SimResult';
import cleanSimsText from 'util/cleanSimsText';
import WorkerPool from 'worker/WorkerPool';

import { compressForUrl } from 'util/compression';
import { tryParseRanges } from 'util/parseRanges';
import SimConfig from 'sim/SimConfig';
import SimRun, { SimProgress } from './SimRun';
import { RunnerState } from './RunnerState';
import iterationScale from 'util/iterationScale';

const runSims = async (rawSims: string, config: SimConfig, selected: Set<string>, setState: (runState: Partial<RunnerState>) => void) => {
  const acValues = tryParseRanges(config.acValues) || [];
  const levels = tryParseRanges(config.levels) || [];
  const pool = new WorkerPool(config.workers);
  const iterations = iterationScale(config.iterations);
  const startTime = +new Date();
  setState({
    status: 'running',
    time: startTime,
    onStop: () => pool.terminate(),
    iterations,
    acValues,
  });
  
  const parseErrors: string[] = [];
  const runs: SimRun[] = cleanSimsText(rawSims.split('\n')).map((rawSimDef): SimRun[] => {
    try {
      const sims = tryParseTestSimDef(rawSimDef)
        .filter((s) => selected.has(s.name) && levels.includes(s.level));
      return sims.map((sim) => acValues.map((ac) => ({
        simulation: sim,
        simParams: createSimParams(sim.level, ac),
        maxProgress: 0,
        minProgress: 0,
        updateTime: 0,
        error: sim.error,
      }))).flat();
    } catch (e) {
      console.error(`Error parsing simulation defintion "${rawSimDef}": ${e}`, e);
      parseErrors.push(`Error parsing "${rawSimDef}": ${e}`);
      return [];
    }
  }).flat();
  setState({
    errors: parseErrors,
    compressedSimDefs: compressForUrl([...new Set(
      runs.map((r) => r.simulation.simDefinition)
    )].join('\n')),
  });

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
          run.updateTime = +new Date();
          setState({ results: runs });
        }
      }, 30, { leading: true });
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

  setState({
    results: runs,
    status: pool.isTerminated() ? 'canceled' : 'completed',
    time: +new Date() - startTime,
  });
};

export default runSims;
