import Distribution from 'util/Distribution';
import SimParams from './SimParams';
import Simulation from './Simulation';
import { Stats } from './Stats';

class SimResult {
  simulation: Simulation;
  simParams: SimParams;
  stats: Stats;
  dist: Distribution;

  constructor(simulation: Simulation, simParams: SimParams, stats: Stats, dist: Distribution) {
    this.simulation = simulation;
    this.simParams = simParams;
    this.stats = stats;
    this.dist = dist;
  }
}

export default SimResult;
