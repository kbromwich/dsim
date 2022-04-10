import SimParams from 'sim/SimParams';
import SimResult from 'sim/SimResult'
import Simulation from 'sim/Simulation';

export interface SimProgress {
  simulation: Simulation;
  simParams: SimParams;
  maxProgress: number;
  minProgress: number;
  error?: string;
  updateTime: number;
}

type SimRun = SimResult | SimProgress;

export default SimRun;
