import ExpressionCreator, { ParseFunc } from './ExpressionCreator';
import { EvalFunc } from './Expression';
import expressionUtils from './expressionUtils';

const { NoPF } = expressionUtils;

function unaryExpr<T>(
  typeName: string,
  sample: string,
  regex: RegExp,
  parseFunc: ParseFunc<T>,
  evalFunc: EvalFunc<T>,
  description: string,
) {
  return new ExpressionCreator({
    typeName,
    regex,
    minSubExprs: 1,
    maxSubExprs: 1,
    parseFunc,
    evalFunc,
    description,
    sample
  });
}

export const UnaryExpressions = [
  unaryExpr('Not', '!', /^!/, NoPF,
    (s, ctx) => (ctx.subExpressions[0].eval(s) ? 0 : 1),
    'Outputs 0 if the right operand is non-zero, otherwise outputs 1.',
  ),
  unaryExpr('Negative', '-', /^-/, NoPF,
    (s, ctx) => (ctx.subExpressions[0].eval(s) * -1),
    'Flips the sign of the right operand (multiply by -1).',
  ),
];
