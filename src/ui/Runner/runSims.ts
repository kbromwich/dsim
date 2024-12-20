import throttle from 'lodash.throttle';

import calculateStats from 'sim/Stats';
import { createSimParams } from 'sim/SimParams';
import WorkerPool from 'worker/sim/WorkerPool';

import SimConfig from 'sim/SimConfig';
import { compressForUrl } from 'util/compression';
import { tryParseRanges } from 'util/parseRanges';
import iterationScale from 'util/iterationScale';
import { AverageDummyAc, AverageSimRun, MutableSimRun } from './SimRun';
import { RunnerState } from './RunnerState';
import { DynamicACData, parseRawDynamicACs } from 'sim/DynamicAC';
import parseIntStrict from 'util/parseIntStrict';
import { ParsedSims } from 'sim/ParsedSims';
import Distribution from 'util/Distribution';

const dedupeSims = (runs: MutableSimRun[]): MutableSimRun[] => {
  const unique = new Map<string, MutableSimRun>();
  runs.forEach((run) => {
    const key = `${run.simulation.name}|${run.simParams.level}|${run.simParams.ac}`;
    const usim = unique.get(key);
    if (!usim) {
      unique.set(key, run);
    } else {
      usim.warnings.push('Duplicate definitions found for this simulation; only the first is used.');
    }
  });
  return [...unique.values()];
};

const runSims = async (
  sims: ParsedSims,
  config: SimConfig,
  selected: Set<string>,
  setState: (runState: Partial<RunnerState>) => void,
) => {
  const acValues = tryParseRanges(config.acValues) || [];
  const dacValues = parseRawDynamicACs(config.dacValues);
  const smOffset = parseIntStrict(config.saveModOffset);
  const dacCalcs = dacValues.map((dac) => DynamicACData[dac].calculate);
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
    dacValues,
    rawAcValues: config.acValues,
    rawDacValues: config.dacValues,
    rawSaveModOffset: config.saveModOffset,
    rawLevels: config.levels,
  });
  
  const averages: AverageSimRun[] = [];
  const selectedNameSims = Object.values(sims.sims)
    .filter((nameSims) => selected.has(nameSims[0].name));

  const runs = selectedNameSims.map((sims) => {
    const selectedLevelSims = sims.filter((s) => levels.includes(s.level));
    return dedupeSims(selectedLevelSims.map((sim) => {
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
      }).flat());
  }).flat();

  const results = [...runs, ...averages];
  setState({
    compressedSimDefs: compressForUrl([...new Set(
      runs.map((r) => r.simulation.source.definition)
    )].join('\n')),
    results,
  });

  const uniqueSims = new Map<string, Distribution>();
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    if (run.error) {
      continue;
    }
    try {
      const rdid = run.dedupeId();
      let dist: Distribution | undefined = uniqueSims.get(rdid)?.clone();
      if (!dist) {
        const workerConfig = {
          expression: run.simulation.rawExpression,
          config: run.simParams,
        };
        const onProgress = throttle((max: number, min: number) => {
          run.setProgress(max, min);
        }, 30, { leading: true });
        dist = await pool.run(workerConfig, iterations, onProgress);
        uniqueSims.set(rdid, dist);
      }
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
