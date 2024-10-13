import { parseSimExpr } from 'sim/parse';
import SimParams from 'sim/SimParams';
import SimState from 'sim/SimState';
import { BaseSimulation } from 'sim/Simulation';
import { MutableDistribution } from 'util/Distribution';
import { ToWorkerMessages } from './Messages';

// Each worker will be effectively run in a separate interpreter, so global
// state isn't actually very global; each worker will have their own copy of
// the below state
let simulation: BaseSimulation | undefined;
let simParams: SimParams | undefined;

onmessage = function(event: MessageEvent<ToWorkerMessages>) {
  const { data } = event;
  if (data.command === 'configure') {
    const { expression, config } = data;
    simulation = new BaseSimulation(expression, parseSimExpr(expression));
    simParams = config;
  } else if (data.command === 'run') {
    const { iterations } = data;
    const distribution = runSims(iterations);
    this.postMessage({ command: 'complete', distribution });
  }
}

function runSims(iterations: number) {
  if (!simulation || !simParams) throw new Error('Worker is not configured!');
  const results = new MutableDistribution();
  const state = new SimState(simParams);
  for (let i = 0; i < iterations; i++) {
    state.reset();
    results.increment(simulation.run(state));
  }
  return results.toImmutable();
}

export {}
