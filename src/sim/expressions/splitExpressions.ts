import { range } from 'util/range';
import ExpressionCreator, { ParseFunc } from './ExpressionCreator';
import Expression, { EvalFunc } from './Expression';
import expressionUtils from './expressionUtils';

const { NoPF, NoMax, sum, roll } = expressionUtils;

function splitExpr<T>(
  typeName: string,
  sample: string,
  regex: RegExp,
  maxSubExprs: number,
  parseFunc: ParseFunc<T>,
  evalFunc: EvalFunc<T>,
  description: string,
) {
  return new ExpressionCreator({
    typeName,
    regex,
    minSubExprs: 2,
    maxSubExprs,
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
  splitExpr('Assign', ':=', /:=/, 2,
    (m, exprs) => ({ storedType: checkType(exprs[0], ['Variable', 'Function']) }),
    (s, ctx) => {
      if (ctx.props.storedType === 'Function') {
        const funcName = (ctx.subExpressions[0].props as { funcName: string })?.funcName;
        s.funcReg.set(funcName, ctx.subExpressions[1]);
      } else if (ctx.props.storedType === 'Variable') {
        const varName = (ctx.subExpressions[0].props as { varName: string })?.varName;
        s.varReg.set(varName, ctx.subExpressions[1].eval(s));
      }
      return 0;
    },
    `Assign value to variable or sub expression to function. Output is 0.

For example:
  $a := 1d6
In the above, the outcome of the 1d6 roll will be assigned to $a for later use. \
This can be useful in cases where you need to know the outcome of an earlier \
attack, such as whether you've already used your sneak attack for the turn:
  ($a := (3+PB =atk> 1D6+3 + 1D6)) + (3+PB =atk> 1D6 + ($a<=0 => 1D6)) + $a

Can also assign a sub expression as a function:
  @a := 3+PB =atk> 1D6+3
In the above, the attack sub expression is assigned to $a for later use. Each \
time it is used later, it will be re-evaluated (dice will be rolled again). \
This can be useful in cases where you want to evaluate the same thing multiple \
times, like sneak attack after each attack:
  (@sa := $sd<=0 => ($sd:=1D6)+$sd) + (3+PB =atk> 1D6+3 + @sa) + (3+PB =atk> 1D6 + @s) + $sd
`,
  ),
  splitExpr('Check', '=>', /=>/, 2, NoPF, (s, ctx) => (ctx.subExpressions[0].eval(s) ? ctx.subExpressions[1].eval(s) : 0),
    `If left operand is non-zero, then output the right operand, otherwise \
output 0. For example:
  1d20 <= 11 => 1d8`
  ),
  splitExpr('Attack', '=atk>', /=atk(?::(\d+))?(?::(adv|dis)(\d+)?)?>/, 2,
    (m) => ({ critmin: Number(m[1] || 20), vantage: parseVantage(m[2], m[3]) }),
    (state, { props, subExpressions }) => {
      let droll = roll(20);
      if (props.vantage > 1 || props.vantage < -1) {
        const rolls = range(Math.abs(props.vantage) - 1).map(() => roll(20));
        const reducer = props.vantage > 0 ? Math.max : Math.min;
        droll = reducer(droll, ...rolls);
      }
      const crit = droll >= props.critmin;
      if (crit || (subExpressions[0].eval(state) + droll >= state.ac)) {
        state.pushCrit(crit);
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
attack is a 20, then the critical hit flag is set (the number of dice rolled in \
the 1D6 damage roll will then be doubled; note that the doubling of dice only \
applies when the uppercase D is used. Using a lowercase d will not double dice).

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
  splitExpr('Save', '=sav>', /=sav:(\d+)(?::(adv|dis))?>/, 2,
    (m) => ({ successmod: (Number(m[1]) / 100.0) ?? 0.5, vantage: m[2] }),
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
  splitExpr('Greater Than Or Equal To', '>=', />=/, 2, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) >= ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is greater than or equal to the right operand, otherwise 0.',
  ),
  splitExpr('Greater Than', '>', /(?<!=)>(?!=)/, 2, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) > ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is greater than the right operand, otherwise 0.',
  ),
  splitExpr('Less Than Or Equal To', '<=', /<=/, 2, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) <= ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is less than or equal to the right operand, otherwise 0.',
  ),
  splitExpr('Less Than', '<', /(?<!=)<(?!=)/, 2, NoPF,
    (s, ctx) => Number(ctx.subExpressions[0].eval(s) < ctx.subExpressions[1].eval(s)),
    'Outputs 1 if the left operand is less than the right operand, otherwise 0.',
  ),
  splitExpr('Add', '+', /\+/, NoMax, NoPF,
    (s, ctx) => sum(ctx.subExpressions.map((e) => e.eval(s))),
    'Outputs the sum of the left operand and right operand',
  ),
  splitExpr('Subtract', '-', /-(?!>)/, NoMax, NoPF,
    (s, ctx) => ctx.subExpressions[0].eval(s) - sum(ctx.subExpressions.slice(1).map((e) => e.eval(s))),
    'Outputs the result of subtracting the right operand from the left operand.',
  ),
  splitExpr('Multiply', '*', /\*/, NoMax, NoPF,
    (s, ctx) => ctx.subExpressions.reduce((a, e) => a * e.eval(s), 1),
    'Outputs the result of multiplying the left operand by the right oeprand.',
  ),
  splitExpr('Divide', '/', /\//, 2, NoPF,
    (s, ctx) => Math.floor(ctx.subExpressions[0].eval(s) / ctx.subExpressions[1].eval(s)),
    `Outputs the result of dividing the left operand by the right oeprand. \
Decimal results are rounded down the nearest whole integer.`,
  ),
  splitExpr('Repeat', '#', /#/, 2, NoPF,
    (s, ctx) => sum([...new Array(Number(ctx.subExpressions[0].eval(s)))].map(() => ctx.subExpressions[1].eval(s))),
    `Outputs the sum of repeating evaluation of the right operand a number of \
times equal to the left operand.`
  ),
  // TODO: Find a nicer 'symbol' for rrlte, or better yet, incorporate it into the dice roll functionality!
  splitExpr('Reroll (If Less Than Or Equal To)', '@rrlte', /@rrlte:/, 2, NoPF,
    (state, ctx) => {
      let droll = ctx.subExpressions[0].eval(state);
      if (droll <= ctx.subExpressions[1].eval(state)) {
        return ctx.subExpressions[0].eval(state)
      }
      return droll;
    },
    `Outputs the left operand, unless it is less than or equal to the right \
operand, in which case it will be re-evaluated (rerolled) once. For example, \
Great Weapon Fighting with a greataxe:
  3+PB =atk> CM#(1d12 @rrlte: 2) + 3
In the above, note the usage of the crit mult (CM) instead of the uppercase D \
dice roll, because the rrlte function would combine the two dice on a crit \
when using the uppercase D dice roll, so would only reroll a double 1.`
  ),
];
