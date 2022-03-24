import SimConfig from './SimConfig';
import Simulation from './Simulation';
import { Stats } from './Stats';

class SimResult {
  simulation: Simulation;
  simConfig: SimConfig;
  stats: Stats;

  constructor(simulation: Simulation, simConfig: SimConfig, stats: Stats) {
    this.simulation = simulation;
    this.simConfig = simConfig;
    this.stats = stats;
  }
}

export default SimResult;
