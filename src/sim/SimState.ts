import Expression from './Expression';
import SimParams from './SimParams';

class SimState implements SimParams {
  // Static state
  readonly ac: number;
  readonly level: number;
  readonly pb: number;
  readonly sm: number;

  // Dynamic state
  readonly critStack: boolean[];
  readonly funcReg: Map<string, Expression>;
  readonly varReg: Map<string, number>;

  constructor(config: SimParams) {
    this.ac = config.ac;
    this.sm = config.sm;
    this.pb = config.pb;
    this.level = config.level;

    this.varReg = new Map();
    this.funcReg = new Map();
    this.critStack = [];
  }

  crit() {
    return !!this.critStack[this.critStack.length - 1];
  }

  popCrit() {
    this.critStack.pop();
  }

  pushCrit(newCrit: boolean) {
    this.critStack.push(newCrit);
  }

  reset() {
    this.critStack.length = 0;
    this.funcReg.clear();
    this.varReg.clear();
  }
}

export default SimState;
