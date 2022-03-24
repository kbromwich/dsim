import { parseSimExpr } from 'sim/parse';
import SimConfig from 'sim/SimConfig';
import SimState from 'sim/SimState';
import { BaseSimulation } from 'sim/Simulation';
import calculateStats from 'sim/Stats';
import { ToWorkerMessages } from './Messages';

// Each worker will be effectively run in a separate interpreter, so global
// state isn't actually very global; each worker will have their own copy of
// the below state
let simulation: BaseSimulation | undefined;
let simConfig: SimConfig | undefined;

onmessage = function(event: MessageEvent<ToWorkerMessages>) {
  const { data } = event;
  if (data.command === 'configure') {
    const { expression, config } = data;
    simulation = new BaseSimulation(expression, parseSimExpr(expression));
    simConfig = config;
  } else if (data.command === 'run') {
    const { iterations } = data;
    const stats = runSims(iterations);
    this.postMessage({ command: 'complete', stats });
  }
}

function runSims(iterations: number) {
  if (!simulation || !simConfig) throw new Error('Worker is not configured!');
  const results: number[] = [];
  const state = new SimState(simConfig);
  for (let i = 0; i < iterations; i++) {
    state.reset();
    results.push(simulation.run(state));
  }
  return calculateStats(results);
}

export {}
