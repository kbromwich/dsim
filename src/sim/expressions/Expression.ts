import SimState from '../SimState';

export type EvalFunc<T> = (s: SimState, ctx: Expression<T>) => number;

export default class Expression<T = unknown> {
  typeName: string;
  rawExpression: string;
  subExpressions: Expression[];
  evalFunc: EvalFunc<T>;
  props: T;

  constructor(typeName: string, expr: string, subExprs: Expression[], evalFunc: EvalFunc<T>, props: T) {
    this.typeName = typeName;
    this.rawExpression = expr;
    this.subExpressions = subExprs;
    this.evalFunc = evalFunc;
    this.props = props;
  }

  eval(state: SimState): number {
    return this.evalFunc(state, this);
  }

  *iterateExpression(): Generator<Expression> {
    yield this as Expression;
    for (const subExpr of this.subExpressions) {
      yield* subExpr.iterateExpression();
    }
  }
}
