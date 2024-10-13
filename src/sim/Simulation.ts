import Expression from './expressions/Expression';
import SimState from './SimState';

export interface SimulationSource {
  definition: string;
  rawExpression: string;
  lineStart?: number;
  lineCount?: number;
}

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
  source: SimulationSource;
  error?: string;

  constructor(name: string, level: number, source: SimulationSource, rootExpr: Expression) {
    super(source.rawExpression, rootExpr);
    this.name = name;
    this.level = level;
    this.source = source;
    this.error = undefined;
  }
  
  id() {
    return `${this.name}@${this.level}`;
  }

  isValid() {
    return !this.error;
  }
}
