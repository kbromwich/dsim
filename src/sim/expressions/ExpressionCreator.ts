import Expression, { EvalFunc } from './Expression';

export type ParseFunc<T> = (match: RegExpExecArray, subExprs: Expression[]) => T;

interface ExpressionParams<T> {
  typeName: string;
  regex: RegExp;
  numOperands?: number;
  parseFunc: ParseFunc<T>;
  evalFunc: EvalFunc<T>;
  sample: string;
  description: string;
}

export default class ExpressionCreator<T> {
  typeName: string;
  regex: RegExp;
  globalRegex: RegExp;
  parseFunc: ParseFunc<T>;
  evalFunc: EvalFunc<T>;
  numOperands: number; 
  sample: string;
  description: string;

  constructor(params: ExpressionParams<T>) {
    this.typeName = params.typeName;
    this.regex = params.regex;
    const gFlags = params.regex.flags ? `${params.regex.flags}g` : 'g';
    this.globalRegex = new RegExp(params.regex.source, gFlags);
    this.parseFunc = params.parseFunc
    this.evalFunc = params.evalFunc;
    this.numOperands = params.numOperands || 0; 

    this.sample = params.sample;
    this.description = params.description;
  }

  create(expr: string, subExprs: Expression[], match: RegExpExecArray) {
    if ((this.numOperands && subExprs.length !== this.numOperands)) {
      throw Error(`Invalid syntax in "${expr}": ${this.typeName} expected ${this.numOperands} operands but got ${subExprs.length}`);
    }
    const props: T = this.parseFunc(match, subExprs);
    return new Expression(this.typeName, expr, subExprs, this.evalFunc, props);
  }
}
