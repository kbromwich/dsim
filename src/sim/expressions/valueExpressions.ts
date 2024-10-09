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

type RollOp = (rolls: number[], param: number, dieSize: number) => number[] | void;
const rollOperations: Record<string, RollOp> = {
  kh: (rolls, param) => rolls.sort((a, b) => (b - a)).slice(0, param),
  kl: (rolls, param) => rolls.sort((a, b) => (a - b)).slice(0, param),
  rrle: (rolls, param, ds) => rolls.forEach((v, i, a) => { if (v <= param) a[i] = roll(ds); }),
  rrlt: (rolls, param, ds) => rolls.forEach((v, i, a) => { if (v < param) a[i] = roll(ds); }),
  rrge: (rolls, param, ds) => rolls.forEach((v, i, a) => { if (v >= param) a[i] = roll(ds); }),
  rrgt: (rolls, param, ds) => rolls.forEach((v, i, a) => { if (v > param) a[i] = roll(ds); }),
  rreq: (rolls, param, ds) => rolls.forEach((v, i, a) => { if (v === param) a[i] = roll(ds); }),
};
const rollOpRegex = Object.keys(rollOperations).join('|');

export const ValueExpressions = [
  valueExpr('Number', 'X', /^\d+$/, (m) => ({ value: Number(m[0]) }), (s, { props }) => props.value,
  'Where X is any positive integer. Outputs the value of the integer.',
  ),
  valueExpr('Roll Dice', 'XdY', new RegExp(`^(\\d*)([dD])(\\d+)((?:(?:${rollOpRegex})\\d+)*)$`),
    (m) => {
      return ({
        crittable: m[2] === 'D',
        dieSize: Number(m[3]),
        numDice: Number(m[1] || 1),
        operations: [...m[4].matchAll(/([a-zA-Z]+)(\d+)/g)].map((om) => ({
          operation: om[1],
          param: Number(om[2]),
        })),
      });
    },
    (s, { props }) => {
      const { crittable, dieSize, numDice, operations } = props;
      let rolls: number[] = [];
      const numWithCrit = (crittable && s.crit()) ? 2 * numDice : numDice;
      for (let i = 0; i < numWithCrit; i += 1) {
        rolls.push(roll(dieSize));
      }
      operations.forEach(({ operation, param }) => {
        rolls = rollOperations[operation](rolls, param, dieSize) || rolls;
      });
      return sum(rolls);
    },
    `Where X and Y are any positive integers. Outputs the sum of rolls with a \
dice of size Y rolled X number of times. For example:
  3d8
In the above, an 8 sided dice will be rolled 3 times, and the output will be \
the sum of the results.

Critical hits can be accounted for with an uppercase D to double the number of \
dice rolled on a critical hit:
  3D8
In the above, if the critical hit flag is set  (in the right operand of an \
Attack where the attack roll was >= to the critical threshold), then an 8 sided \
dice will be rolled 6 times.

Can also append additional modifier operations after the above basic rolls, \
such as "keep highest":
  3d8kh2
The above rolls 3 d8s, and keeps the two highest rolls. To simulate the "Great \
Weapon Fighting Style" you could instead use rrle:
  2D6rrle2
Which rolls 2 d6s (or 4 on a crit), and rerolls any 1s and 2s. Any number of \
these operations can be appended, such as:
  4d6kl2rrle2kh1
Which rolls 4 d6s, then keeps the lowest 2, then rerolls any of the remaining 2 \
that are 2 or less, then keeps the highest 1 of those remaining 2.

The available modifier operations (where X is any positive integer) are:
  khX: Keep the highest X dice
  klX: Keep the lowest X dice
  rrleX: Reroll (only once) any dice that are less than or equal to X
  rrltX: Reroll (only once) any dice that are less than X
  rrgeX: Reroll (only once) any dice that are greater than or equal to X
  rrgtX: Reroll (only once) any dice that are greater than X
  rreqX: Reroll (only once) any dice that are equal to X
`
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
  valueExpr('Variable', '$X', /^\$([a-zA-Z0-9]+)$/,
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
  valueExpr('Function', '@X', /^@([a-zA-Z0-9]+)$/,
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
