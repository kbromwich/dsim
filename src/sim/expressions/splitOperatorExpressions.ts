import { range } from 'util/range';
import ExpressionCreator, { ParseFunc } from './ExpressionCreator';
import Expression, { EvalFunc } from './Expression';
import expressionUtils from './expressionUtils';

const { NoPF, sum, roll } = expressionUtils;

export enum SplitExpression {
  Discard = 'Discard',
  Assign = 'Assign',
  AssignAndEvaluate = 'Assign (and Evaluate)',
  // AssignIfNotAlreadyZero = 'Assign If Not Already Zero',
  // AssignIfAlreadyNonZero = 'Assign If Already Non-Zero',
  Check = 'Check',
  Attack = 'Attack',
  Save = 'Save',
  Or = 'Or',
  And = 'And',
  GreaterThanOrEqualTo = 'Greater Than Or Equal To',
  GreaterThan = 'Greater Than',
  LessThanOrEqualTo = 'Less Than Or Equal To',
  LessThan = 'Less Than',
  NotEqualTo = 'Not Equal To',
  EqualTo = 'Equal To',
  Add = 'Add',
  Subtract = 'Subtract',
  Multiply = 'Multiply',
  Divide = 'Divide',
  Repeat = 'Repeat',
  RerollIfLessThanOrEqualTo = 'Reroll (If Less Than Or Equal To)',
}

function splitExpr<T>(
  typeName: SplitExpression,
  sample: string,
  regex: RegExp,
  parseFunc: ParseFunc<T>,
  evalFunc: EvalFunc<T>,
  description: string,
) {
  return new ExpressionCreator({
    typeName,
    regex,
    numOperands: 2,
    parseFunc,
    evalFunc,
    description,
    sample
  });
}

const checkType = (expr: Expression, type_names: string[]) => {
  if (!type_names.includes(expr.typeName)) {
    throw Error(`Type of "${expr.rawExpression}" was expected to be one of "${type_names}", but was "${expr.typeName}"`)
  }
  return expr.typeName;
}

const parseVantage = (vantage: string, num?: string) => {
  if (vantage === 'adv') {
    return Number(num || 2)
  } else if (vantage === 'dis') {
    return -Number(num || 2)
  }
  return 0;
};

export const SplitExpressions = [
  splitExpr(SplitExpression.Discard, ';', /;/, NoPF,
    (s, ctx) => { ctx.subExpressions[0].eval(s); return ctx.subExpressions[1].eval(s) },
    `The result of the left operand is discarded (though is still evaluated, so \
variables and functions will be assigned); output is the result of the \
right operand. Can be useful after assignment when the assigned value should \
not be immediately added.`
  ),
  splitExpr(SplitExpression.Assign, ':=', /:=/,
    (m, exprs) => ({ storedType: checkType(exprs[0], ['Variable', 'Function']) }),
    (s, ctx) => {
      if (ctx.props.storedType === 'Function') {
        const funcName = (ctx.subExpressions[0].props as { funcName: string })?.funcName;
        s.funcReg.set(funcName, ctx.subExpressions[1]);
      } else if (ctx.props.storedType === 'Variable') {
        const varName = (ctx.subExpressions[0].props as { varName: string })?.varName;
        const value = ctx.subExpressions[1].eval(s);
        s.varReg.set(varName, value);
      }
      return 0;
    },
    `Assign value to variable or sub expression to function. Output is 0.

For example:
  $a := 1d6
In the above, the outcome of the 1d6 roll will be assigned to $a for later use. \
This can be useful in cases where you need to know the outcome of an earlier \
attack, such as whether you've already used your sneak attack for the turn:
  ($a := (3+PB =atk> 1D6+3 + 1D6)) + (3+PB =atk> 1D6 + ($a<=0 => 1D6))

Can also assign a sub expression as a function:
  @a := 3+PB =atk> 1D6+3
In the above, the attack sub expression is assigned to $a for later use. Each \
time it is used later, it will be re-evaluated (dice will be rolled again):
  (@a := 1D6+3); (3+PB =atk> @a) + (5+PB =atk> @a)

These can be combined to useful effect; for example, effects that can only
happen once per turn, but have multiple opportunities to happen, like sneak \
attack:
  @sa := !$sd => ($sd=1D6); (3+PB =atk> 1D6+3 + @sa) + (3+PB =atk> 1D6 + @sa)
The above defines a function "@sa" (sneak attack) that will roll 1D6, and assign \
the result to "$sd" (sneak damage); but only if "$sd" is a not ("!") zero (i.e. \
has already been rolled). The ";" separates it from the rest of the expression. \
Then "@sd" can be inserted anywhere the sneak attack could occur (on any attack \
hit). Note that this method will mean that the sneak attack always occurs on \
the first attack that hits.`,
  ),
  splitExpr(SplitExpression.AssignAndEvaluate, '=', /(?<![=<>!:&|])=(?![=>a-zA-Z])/,
    (m, exprs) => ({ storedType: checkType(exprs[0], ['Variable', 'Function']) }),
    (s, ctx) => {
      if (ctx.props.storedType === 'Function') {
        const funcName = (ctx.subExpressions[0].props as { funcName: string })?.funcName;
        s.funcReg.set(funcName, ctx.subExpressions[1]);
        return s.funcReg.get(funcName)?.eval(s) || 0;
      } else if (ctx.props.storedType === 'Variable') {
        const varName = (ctx.subExpressions[0].props as { varName: string })?.varName;
        const value = ctx.subExpressions[1].eval(s);
        s.varReg.set(varName, value);
        return value;
      }
      return 0;
    },
    `Assign value to variable or sub expression to function. Output is the \
result of evaluating the assigned expression. This is the same as ":=", except \
for the output. NOTE this means that any assigned function will be evaluated\
immediately, and any variables changed as part of the function will be changed \
when it is immediately evaluated!`,
  ),
//   splitExpr(SplitExpression.Assign If Not Already Zero, '|=', /\|=/,
//     (m, exprs) => ({ storedType: checkType(exprs[0], ['Variable']) }),
//     (s, ctx) => {
//       if (ctx.props.storedType === 'Variable') {
//         const varName = (ctx.subExpressions[0].props as { varName: string })?.varName;
//         const oldValue = s.varReg.get(varName);
//         if (!oldValue) {
//           const value = ctx.subExpressions[1].eval(s);
//           s.varReg.set(varName, value);
//           return value;
//         }
//         return oldValue;
//       }
//       return 0;
//     },
//     `Assigns to the variable if it is not already set or is set to zero. The \
//     following expressions are equivalent:
//       $a |= 2
//       $a = $a || 2`,
//   ),
//   splitExpr(SplitExpression.Assign If Already Non-Zero, '&=', /&=/,
//     (m, exprs) => ({ storedType: checkType(exprs[0], ['Variable']) }),
//     (s, ctx) => {
//       if (ctx.props.storedType === 'Variable') {
//         const varName = (ctx.subExpressions[0].props as { varName: string })?.varName;
//         const oldValue = s.varReg.get(varName);
//         if (oldValue) {
//           const value = ctx.subExpressions[1].eval(s);
//           s.varReg.set(varName, value);
//           return value;
//         }
//         return oldValue || 0;
//       }
//       return 0;
//     },
//     `Assigns to the variable if it is already set to a non-zero value. The \
// following expressions are equivalent:
//   $a &= 2
//   $a = $a && 2`,
//   ),
  splitExpr(SplitExpression.Check, '=>', /=>/, NoPF, (s, ctx) => {
    return (ctx.subExpressions[0].eval(s) ? ctx.subExpressions[1].eval(s) : 0);
  },
    `If left operand is non-zero, then output the right operand, otherwise \
output 0. For example:
  (1d20 <= 11) => 1d8`
  ),
  splitExpr(SplitExpression.Attack, '=atk>', /=atk(?::(\d+))?(?::(adv|dis)(\d+)?)?>/,
    (m) => ({ critmin: Number(m[1] || 20), vantage: parseVantage(m[2], m[3]) }),
    (state, { props, subExpressions }) => {
      let droll = roll(20);
      if (props.vantage > 1 || props.vantage < -1) {
        const rolls = range(Math.abs(props.vantage) - 1).map(() => roll(20));
        const reducer = props.vantage > 0 ? Math.max : Math.min;
        droll = reducer(droll, ...rolls);
      }
      const critMiss = droll === 1;
      const critHit = droll >= props.critmin;
      if (!critMiss && (critHit || (subExpressions[0].eval(state) + droll >= state.ac))) {
        state.pushCrit(critHit);
        const result = subExpressions[1].eval(state);
        state.popCrit();
        return result;
      }
      return 0;
    },
    `Make an attack. The left operand will be added to the d20 roll, and if \
the result meets the AC then the output is the right operand. For example:
  3+PB =atk> 1D6+3
The above is mostly equivalent to:
  (3+PB + 1d20 >= AC) => 1D6+3
However, the =atk> operator also accounts for crits. If the d20 rolled for the \
attack is a 1, then the attack will miss regardless of modifiers and AC. If the \
d20 rolled for the attack is a 20, then the critical hit flag is set (the \
number of dice rolled in the 1D6 damage roll will then be doubled; note that \
the doubling of dice only applies when the uppercase D is used; using a \
lowercase d will not double dice).

Can also specify that the attack be made with advantage or disadvantage:
  3+PB =atk:adv> 1D6+3
  3+PB =atk:dis> 1D6+3
Or even super advantage or disadvantage:
  3+PB =atk:adv3> 1D6+3
  3+PB =atk:dis3> 1D6+3

Can also specify the minimum critical hit threshold, for example if you can \
crit on a 19:
  3+PB =atk:19> 1D6+3

Note that if you specify both adv/dis and crit threshold, the crit threshold \
should come first:
3+PB =atk:19:dis> 1D6+3`,
  ),
  splitExpr(SplitExpression.Save, '=sav>', /=sav:(\d+)(?::(adv|dis))?>/,
    (m) => ({ successmod: (Number(m[1] ?? 50) / 100.0), vantage: m[2] }),
    (state, ctx) => {
      let droll = roll(20);
      if (ctx.props.vantage === 'adv') {
        droll = Math.max(droll, roll(20));
      } else if (ctx.props.vantage === 'dis') {
        droll = Math.min(droll, roll(20));
      }

      const dmg = ctx.subExpressions[1].eval(state)
      if (droll + state.sm >= ctx.subExpressions[0].eval(state)) {
        return Math.floor(dmg * ctx.props.successmod);
      }
      return dmg;
    },
    `Have the target make a saving throw. The left operand is the difficulty \
class (DC) of the save; if the target save (1d20 + SM) does not meet the DC, \
then the output will be the right operand. Otherwise, if the target save does \
meet the DC, then the output will be half the right operand. For example:
  8+3+PB =sav> 3d8
The above is equivalent to:
  ($s := 1d20 + SM) + ($s < 8+3+PB => 3d8) + ($s >= 8+3+PB => 3d8/2)

Can also specify that the save be made with advantage or disadvantage:
  8+3+PB =sav:adv> 3d8
  8+3+PB =sav:dis> 3d8

Can also specify the output modifier for save success, for example if suceeding \
on the save results in no damage being taken:
  8+3+PB =sav:0> 3d8
Note the the success modifier is specified as a positive integer percentage, so \
a value of 25 would mean that the damage is quartered.

Note that if you specify both adv/dis and success modifier, the success modifier \
should come first:
  8+3+PB =sav:0:adv> 3d8`,
  ),
  splitExpr(SplitExpression.Or, '||', /\|\|/, NoPF,
    (s, ctx) => ctx.subExpressions[0].eval(s) || ctx.subExpressions[1].eval(s),
    'Outputs the second operand if the first is 0, otherwise outputs the first operand.',
  ),
  splitExpr(SplitExpression.And, '&&', /&&/, NoPF,
    (s, ctx) => ctx.subExpressions[0].eval(s) && ctx.subExpressions[1].eval(s),
    'Outputs the second operand if the first is non-zero, otherwise outputs 0',
  ),
  splitExpr(SplitExpression.GreaterThanOrEqualTo, '>=', />=/, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) >= ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is greater than or equal to the right operand, otherwise 0.',
  ),
  splitExpr(SplitExpression.GreaterThan, '>', /(?<!=)>(?!=)/, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) > ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is greater than the right operand, otherwise 0.',
  ),
  splitExpr(SplitExpression.LessThanOrEqualTo, '<=', /<=/, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) <= ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is less than or equal to the right operand, otherwise 0.',
  ),
  splitExpr(SplitExpression.LessThan, '<', /(?<!=)<(?!=)/, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) < ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is less than the right operand, otherwise 0.',
  ),
  splitExpr(SplitExpression.NotEqualTo, '!=', /!=(?!>)/, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) !== ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is not equal to the right operand, otherwise 0.',
  ),
  splitExpr(SplitExpression.EqualTo, '==', /==(?!>)/, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) === ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is equal to the right operand, otherwise 0.',
  ),
  splitExpr(SplitExpression.Add, '+', /\+/, NoPF,
    (s, ctx) => sum(ctx.subExpressions.map((e) => e.eval(s))),
    'Outputs the sum of the left operand and right operand',
  ),
  splitExpr(SplitExpression.Subtract, '-', /(?<![-+*/=><|&])-(?!>)/, NoPF,
    (s, ctx) => ctx.subExpressions[0].eval(s) - sum(ctx.subExpressions.slice(1).map((e) => e.eval(s))),
    'Outputs the result of subtracting the right operand from the left operand.',
  ),
  splitExpr(SplitExpression.Multiply, '*', /\*/, NoPF,
    (s, ctx) => ctx.subExpressions.reduce((a, e) => a * e.eval(s), 1),
    'Outputs the result of multiplying the left operand by the right operand.',
  ),
  splitExpr(SplitExpression.Divide, '/', /\//, NoPF,
    (s, ctx) => Math.floor(ctx.subExpressions[0].eval(s) / ctx.subExpressions[1].eval(s)),
    `Outputs the result of dividing the left operand by the right operand. \
Decimal results are rounded down the nearest whole integer.`,
  ),
  splitExpr(SplitExpression.Repeat, '#', /#/, NoPF, 
    (s, ctx) => {
      const num = Number(ctx.subExpressions[0].eval(s));
      if (num < 0) {
        throw new Error(`Cannot repeat a negative (${num}) number of times: ${ctx.rawExpression}`);
      }
      return sum([...new Array(num)].map(() => ctx.subExpressions[1].eval(s)))
    },
    `Outputs the sum of repeating evaluation of the right operand a number of \
times equal to the left operand. Left operand must be a positive integer.`,
  ),
  // TODO: Remove this at some point
  splitExpr(SplitExpression.RerollIfLessThanOrEqualTo, '@rrlte:', /@rrlte:/,
    (): {} => { throw new Error('@rrlte: has been removed; use the 2d6rrle2 syntax instead') },
    () => { throw new Error('@rrlte: has been removed; use the 2d6rrle2 syntax instead') },
    '',
  ),
];
