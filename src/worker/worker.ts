import { parseSimExpr } from 'sim/parse';
import SimConfig from 'sim/SimConfig';
import SimState from 'sim/SimState';
import { BaseSimulation } from 'sim/Simulation';
import calculateStats from 'util/calculateStats';
import { ToWorkerMessages } from './Messages';
import WorkerCommand from './WorkerCommand';

let simulation: BaseSimulation | undefined;
let simConfig: SimConfig | undefined;

onmessage = function(event: MessageEvent<ToWorkerMessages>) {
  const { data } = event;
  if (data.command === WorkerCommand.Configure) {
    const { expression, config } = data;
    simulation = new BaseSimulation(expression, parseSimExpr(expression));
    simConfig = config;
  } else if (data.command === WorkerCommand.Run) {
    const { iterations } = data;
    this.postMessage({
      command: WorkerCommand.Complete,
      stats: runSims(iterations),
    });
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
  console.log('results size', results.length);
  return calculateStats(results);
}

export {}