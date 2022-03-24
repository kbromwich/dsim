import Expression, { EvalFunc } from './Expression';

export type ParseFunc<T> = (match: RegExpExecArray, subExprs: Expression[]) => T;

export default class ExpressionCreator<T> {
  typeName: string;
  regex: RegExp;
  parseFunc: ParseFunc<T>;
  evalFunc: EvalFunc<T>;
  min: number; 
  max?: number;

  constructor(typeName: string, regex: RegExp, min: number, max: number, parseFunc: ParseFunc<T>, evalFunc: EvalFunc<T>) {
    this.typeName = typeName
    this.regex = regex;
    this.parseFunc = parseFunc
    this.evalFunc = evalFunc;
    this.min = min; 
    this.max = max;
  }

  create(expr: string, subExprs: Expression[]) {
    if ((this.min && subExprs.length < this.min) || (this.max && subExprs.length > this.max)) {
      throw Error(`Invalid syntax in "${expr}": ${this.typeName} expected between ${this.min} and ${this.max} operands but got ${subExprs.length}`);
    }
    let matches: RegExpExecArray | null;
    // This is pretty hacky, but works for now...
    if (subExprs.length > 0) {
      matches = this.regex.exec(expr.substring(subExprs[0].rawExpression.length));
    } else {
      matches = this.regex.exec(expr);
    }
    if (!matches) {
      throw new Error(`Unexpected match failure for ${this.typeName} in "${expr}"`);
    }
    const props: T = this.parseFunc(matches, subExprs);
    return new Expression(this.typeName, expr, subExprs, this.evalFunc, props);
  }
}
