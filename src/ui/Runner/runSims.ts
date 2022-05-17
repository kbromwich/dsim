import throttle from 'lodash.throttle';

import calculateStats from 'sim/Stats';
import { createSimParams } from 'sim/SimParams';
import SimResult from 'sim/SimResult';
import WorkerPool from 'worker/WorkerPool';

import SimConfig from 'sim/SimConfig';
import { ParsedSims } from 'ui/useParsedSims';
import { compressForUrl } from 'util/compression';
import { tryParseRanges } from 'util/parseRanges';
import iterationScale from 'util/iterationScale';
import SimRun, { SimProgress } from './SimRun';
import { RunnerState } from './RunnerState';
import { DynamicACData, parseRawDynamicACs } from 'sim/DynamicAC';
import parseIntStrict from 'util/parseIntStrict';

const runSims = async (sims: ParsedSims, config: SimConfig, selected: Set<string>, setState: (runState: Partial<RunnerState>) => void) => {
  const acValues = tryParseRanges(config.acValues) || [];
  const dynamicACs = parseRawDynamicACs(config.dynamicAc);
  const smOffset = parseIntStrict(config.saveModOffset);
  const dacCalcs = dynamicACs.map((dac) => DynamicACData[dac].calculate);
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
    dynamicACs,
    rawAcValues: config.acValues,
    rawDynamicAc: config.dynamicAc,
    rawLevels: config.levels,
  });
  
  const runs: SimRun[] = Object.values(sims.sims).flat()
    .filter((s) => selected.has(s.name) && levels.includes(s.level))
    .map((sim): SimRun[] => {
      const dacAcs = dacCalcs.map((calc) => calc(sim.level));
      return [...new Set([...acValues, ...dacAcs])].map((ac) => ({
        simulation: sim,
        simParams: createSimParams(sim.level, ac, smOffset),
        maxProgress: 0,
        minProgress: 0,
        updateTime: 0,
        error: sim.error,
      }))
    }).flat();
  setState({
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
      const dist = await pool.run(workerConfig, iterations, onProgress);
      runs[i] = new SimResult(run.simulation, run.simParams, calculateStats(dist), dist);
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
