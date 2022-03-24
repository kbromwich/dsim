import SimConfig from 'sim/SimConfig';
import SimResult from 'sim/SimResult'
import Simulation from 'sim/Simulation';

export interface SimProgress {
  simulation: Simulation;
  simConfig: SimConfig;
  maxProgress: number;
  minProgress: number;
  error?: string;
  updateCount: number;
}

type SimRun = SimResult | SimProgress;

export default SimRun;
