import Expression, { EvalFunc } from './Expression';

export type ParseFunc<T> = (match: RegExpExecArray, subExprs: Expression[]) => T;

interface ExpressionParams<T> {
  typeName: string;
  regex: RegExp;
  minSubExprs?: number;
  maxSubExprs?: number;
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
  min: number; 
  max: number;
  sample: string;
  description: string;

  constructor(params: ExpressionParams<T>) {
    this.typeName = params.typeName;
    this.regex = params.regex;
    const gFlags = params.regex.flags ? `${params.regex.flags}g` : 'g';
    this.globalRegex = new RegExp(params.regex.source, gFlags);
    this.parseFunc = params.parseFunc
    this.evalFunc = params.evalFunc;
    this.min = params.minSubExprs || 0; 
    this.max = params.maxSubExprs || 0;

    this.sample = params.sample;
    this.description = params.description;
  }

  create(expr: string, subExprs: Expression[], match: RegExpExecArray) {
    if ((this.min && subExprs.length < this.min) || (this.max && subExprs.length > this.max)) {
      throw Error(`Invalid syntax in "${expr}": ${this.typeName} expected between ${this.min} and ${this.max} operands but got ${subExprs.length}`);
    }
    const props: T = this.parseFunc(match, subExprs);
    return new Expression(this.typeName, expr, subExprs, this.evalFunc, props);
  }
}
