import { SplitExpression } from 'sim/expressions/splitOperatorExpressions';
import { ValueExpression } from 'sim/expressions/valueExpressions';
import SimParams from 'sim/SimParams';
import Simulation from 'sim/Simulation';
import calculateStats, { Stats } from 'sim/Stats';
import Distribution from 'util/Distribution';

type Observer = (run: SimRun) => void;

class SimRun {

  simulation: Simulation;
  simParams: SimParams;

  finished: boolean;
  maxProgress: number;
  minProgress: number;
  updateTime: number;
  warnings: string[];
  
  error?: string;
  stats?: Stats;
  dist?: Distribution;

  private observers: Set<Observer>;

  constructor(simulation: Simulation, simParams: SimParams) {
    this.simulation = simulation;
    this.simParams = simParams;

    this.finished = false;
    this.maxProgress = 0;
    this.minProgress = 0;
    this.updateTime = 0;
    this.warnings = [];

    this.observers = new Set();
  }

  addObserver(observer: Observer) {
    this.observers.add(observer);
  }

  removeObserver(observer: Observer) {
    this.observers.delete(observer);
  }

  protected notifyObservers() {
    this.observers.forEach((obs) => obs(this));
  }

  dedupeId() {
    let usedLevel = false;
    let usedAc = false;
    let usedPb = false;
    let usedSm = false;
    for (let exp of this.simulation.rootExpression.iterateExpression()) {
      const type = exp.typeName;
      if (type === ValueExpression.Level) {
        usedLevel = true;
      } else if (type === ValueExpression.ArmorClass) {
        usedAc = true;
      } else if (type === ValueExpression.ProficiencyBonus) {
        usedPb = true;
      } else if (type === ValueExpression.SaveModifier) {
        usedSm = true;
      } else if (type === SplitExpression.Attack) {
        usedAc = true;
      } else if (type === SplitExpression.Save) {
        usedSm = true;
      }
    }
    return [
      usedLevel && `LV${this.simParams.level}`,
      usedAc && `AC${this.simParams.ac}`,
      usedPb && `PB${this.simParams.pb}`,
      usedSm && `SM${this.simParams.sm}`,
      this.simulation.rawExpression,
    ].filter((v) => v !== false).join('|');
  }
}

export class MutableSimRun extends SimRun {
  setProgress(max: number, min: number) {
    this.maxProgress = max;
    this.minProgress = min;
    this.updateTime = +new Date();
    this.notifyObservers();
  }

  setToErrored(error: string) {
    this.error = error;
    this.finished = true;
    this.notifyObservers();
  }

  setToComplete(stats: Stats, dist: Distribution) {
    this.stats = stats;
    this.dist = dist;
    this.finished = true;
    this.notifyObservers();
  }
}

export const AverageDummyAc = -1;

export class AverageSimRun extends MutableSimRun {
  private simsToAvg: SimRun[];

  constructor(simulation: Simulation, simParams: SimParams, simsToAvg: SimRun[]) {
    super(simulation, simParams);
    this.simsToAvg = simsToAvg;
    simsToAvg.forEach((sim) => sim.addObserver((run) => this.onSimUpdated(run)));
  }

  onSimUpdated(sim: SimRun) {
    const count = this.simsToAvg.reduce((sum, cur) => (
      sum + (cur.finished ? 1 : 0)
    ), 0);
    if (count === this.simsToAvg.length) {
      const error = this.simsToAvg.find((s) => s.error)?.error;
      if (error) {
        this.setToErrored(error);
      } else {
        const dists = this.simsToAvg.map((r) => r.dist).filter(Boolean) as Distribution[];
        const avg = Distribution.merge(...dists);
        this.setToComplete(calculateStats(avg), avg);
      }
    } else {
      const min = this.simsToAvg.reduce((sum, cur) => sum + cur.minProgress, 0);
      const max = this.simsToAvg.reduce((sum, cur) => sum + cur.maxProgress, 0);
      this.setProgress(max / this.simsToAvg.length, min / this.simsToAvg.length);
    }
  }
}

export default SimRun;
