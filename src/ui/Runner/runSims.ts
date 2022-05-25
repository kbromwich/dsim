import throttle from 'lodash.throttle';

import calculateStats from 'sim/Stats';
import { createSimParams } from 'sim/SimParams';
import WorkerPool from 'worker/WorkerPool';

import SimConfig from 'sim/SimConfig';
import { ParsedSims } from 'ui/useParsedSims';
import { compressForUrl } from 'util/compression';
import { tryParseRanges } from 'util/parseRanges';
import iterationScale from 'util/iterationScale';
import SimRun, { AverageDummyAc, AverageSimRun, MutableSimRun } from './SimRun';
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
  
  const averages: AverageSimRun[] = [];
  const runs: MutableSimRun[] = Object.values(sims.sims).flat()
    .filter((s) => selected.has(s.name) && levels.includes(s.level))
    .map((sim) => {
      const dacAcs = dacCalcs.map((calc) => calc(sim.level));
      const simLevelAcs = [...new Set([...acValues, ...dacAcs])].map((ac) => {
        const run = new MutableSimRun(sim, createSimParams(sim.level, ac, smOffset));
        if (sim.error) {
          run.setToErrored(sim.error);
        }
        return run;
      });
      averages.push(new AverageSimRun(
        sim,
        createSimParams(sim.level, AverageDummyAc, NaN),
        simLevelAcs,
      ));
      return simLevelAcs;
    }).flat();
  const results = [...runs, ...averages];
  setState({
    compressedSimDefs: compressForUrl([...new Set(
      runs.map((r) => r.simulation.simDefinition)
    )].join('\n')),
    results,
  });

  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    if (run.error) {
      continue;
    }
    try {
      const workerConfig = {
        expression: run.simulation.rawExpression,
        config: run.simParams,
      };
      const onProgress = throttle((max: number, min: number) => {
        run.setProgress(max, min);
      }, 30, { leading: true });
      const dist = await pool.run(workerConfig, iterations, onProgress);
      run.setToComplete(calculateStats(dist), dist);
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
    results,
    status: pool.isTerminated() ? 'canceled' : 'completed',
    time: +new Date() - startTime,
  });
};

export default runSims;
