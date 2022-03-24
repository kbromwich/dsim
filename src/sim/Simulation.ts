import Expression from './Expression';
import SimState from './SimState';

export class BaseSimulation {
  rawExpression: string;
  rootExpression: Expression;

  constructor(rawExpr: string, rootExpr: Expression) {
    this.rawExpression = rawExpr
    this.rootExpression = rootExpr
  }

  run(initialState: SimState) {
    return this.rootExpression.eval(initialState)
  }
}

export default class Simulation extends BaseSimulation {
  name: string;
  level: number;
  simDefinition: string;
  error?: string;

  constructor(name: string, level: number, simDef: string, rawExpr: string, rootExpr: Expression) {
    super(rawExpr, rootExpr);
    this.name = name;
    this.level = level;
    this.simDefinition = simDef;
    this.error = undefined;
  }
  
  id() {
    return `${this.name}@${this.level}`;
  }

  isValid() {
    return !this.error;
  }
}
