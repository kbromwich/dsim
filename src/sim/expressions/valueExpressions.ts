import ExpressionCreator, { ParseFunc } from './ExpressionCreator';
import { EvalFunc } from './Expression';
import expressionUtils from './expressionUtils';

const { NoPF, sum, roll } = expressionUtils;

function valueExpr<T>(
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
    parseFunc,
    evalFunc,
    description,
    sample
  });
}

export const ValueExpressions = [
  valueExpr('Number', 'X', /^\d+$/, (m) => ({ value: Number(m[0]) }), (s, { props }) => props.value,
  'Where X is any positive integer. Outputs the value of the integer.',
  ),
  valueExpr('Roll Dice', 'XdY', /^(\d*)d(\d+)(?:k(h|l)(\d+))?$/,
  (m) => ({
    dice: new Array(Number(m[1] || 1)).fill(Number(m[2])),
    keep: (m[3] === 'l' ? -1 : 1) * Number(m[4] || m[1] || 1),
  }),
  (s, { props }) => {
    const sortedRolls = props.dice.map(roll).sort((a, b) => (b - a) * Math.sign(props.keep));
    const keptRolls = sortedRolls.slice(0, Math.abs(props.keep || props.dice.length));
    return sum(keptRolls);
  },
    `Where X and Y are any positive integers. Outputs the sum of rolls with a \
dice of size Y rolled X number of times. For example:
  3d8
In the above, an 8 sided dice will be rolled 3 times, and the output will be \
the sum of the results.`
  ),
  valueExpr('roll_crit', '', /^(\d*)D(\d+)?$/,
    (m) => ({ dice: new Array(Number(m[1] || 1)).fill(Number(m[2])) }),
    (s, { props }) => sum(props.dice.map((d) => roll(d) + (s.crit() ? roll(d) : 0))),
    'Deprecated. Will be removed very soon.',
  ),
  valueExpr('Armor Class', 'AC', /^AC$/, NoPF, (s, ctx) => s.ac,
    'Outputs the armor class of the target the simulation is being run against.'
  ),
  valueExpr('Save Modifier', 'SM', /^SM$/, NoPF, (s, ctx) => s.ac,
    'Outputs the save modifier of the target the simulation is being run against.'
  ),
  valueExpr('Proficiency Bonus', 'PB', /^PB$/, NoPF, (s, ctx) => s.pb,
    'Outputs the proficiency bonus for the level of the character build.'
  ),
  valueExpr('Level', 'LV', /^LV$/, NoPF, (s, ctx) => s.level,
    'Outputs the level of the character build.'
  ),
  valueExpr('Critical Multiplier', 'CM', /^CM$/, NoPF, (s, ctx) => Number(s.crit()) * 1 + 1,
    `Outputs 2 if critical flag is set (in the right operand of an Attack where \
  the attack roll was >= to the critical threshold), otherwise 1.`
  ),
  valueExpr('Critical Binary', 'CB', /^CB$/, NoPF, (s, ctx) => Number(s.crit()) * 1,
    `Outputs 1 if critical flag is set (in the right operand of an Attack where \
the attack roll was >= to the critical threshold), otherwise 0.`
  ),
  valueExpr('Empty', '', /^$/, NoPF, (s, ctx) => 0,
    'A quirk of the parsing implementation. Ignore'
  ),
  valueExpr('Variable', '$X', /^\$([\d\w]+)$/,
    (m) => ({ varName: m[1] }),
    (s, ctx) => s.varReg.get(ctx.props.varName) || 0,
    `Where X is a string of alphanumeric characters. A variable that can be \
stored and retrieved. Outputs the value of the variable, which starts as 0. \
For example:
  $a := 1d6
In the above, the outcome of the 1d6 roll will be assigned to $a for later use. \
This can be useful in cases where you need to know the outcome of an earlier \
attack, such as whether you've already used your sneak attack for the turn:
  ($a := (3+PB =atk> 1D6+3 + 1D6)) + (3+PB =atk> 1D6 + ($a<=0 => 1D6)) + $a`,
  ),
  valueExpr('Function', '@X', /^@([\d\w]+)$/,
    (m) => ({ funcName: m[1] }),
    (s, ctx) => s.funcReg.get(ctx.props.funcName)?.eval(s) || 0,
    `Where X is a string of alphanumeric characters. A function that can be \
assigned a sub expression and then later evaluated. \
Outputs the result of evaluating the sub expression (any dice rolls will be \
rerolled each time), or 0 if an expression has not yet been assigned. For \
example:
  @a := 3+PB =atk> 1D6+3
In the above, the attack sub expression is assigned to $a for later use. Each \
time it is used later, it will be re-evaluated (dice will be rolled again). \
This can be useful in cases where you want to evaluate the same thing multiple \
times, like sneak attack after each attack:
  (@sa := $sd<=0 => ($sd:=1D6)+$sd) + (3+PB =atk> 1D6+3 + @sa) + (3+PB =atk> 1D6 + @s) + $sd`,
  ),
];
