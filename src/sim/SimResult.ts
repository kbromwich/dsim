import SimParams from './SimParams';
import Simulation from './Simulation';
import { Stats } from './Stats';

class SimResult {
  simulation: Simulation;
  simParams: SimParams;
  stats: Stats;

  constructor(simulation: Simulation, simParams: SimParams, stats: Stats) {
    this.simulation = simulation;
    this.simParams = simParams;
    this.stats = stats;
  }
}

export default SimResult;
