import { range } from 'util/range';
import ExpressionCreator, { ParseFunc } from './ExpressionCreator';
import Expression, { EvalFunc } from './Expression';

const NoPF = () => ({});
const NoMax = 999;


function splitExpr<T>(typeName: string, regex: RegExp, maxSubExprs: number, parseFunc: ParseFunc<T>, evalFunc: EvalFunc<T>) {
  return new ExpressionCreator(typeName, regex, 2, maxSubExprs, parseFunc, evalFunc);
}

function valueExpr<T>(typeName: string, regex: RegExp, parseFunc: ParseFunc<T>, evalFunc: EvalFunc<T>) {
  return new ExpressionCreator(typeName, regex, 0, 0, parseFunc, evalFunc);
}

let randomFunction = Math.random;
const sum = (values: number[]) => values.reduce((prev, cur) => prev + cur, 0);
const roll = (die: number) => Math.floor(randomFunction() * die) + 1;

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
  splitExpr('assign', /:=/, 2,
    (m, exprs) => ({ storedType: checkType(exprs[0], ['variable', 'function']) }),
    (s, ctx) => {
      if (ctx.props.storedType === 'function') {
        const funcName = (ctx.subExpressions[0].props as { funcName: string })?.funcName;
        s.funcReg.set(funcName, ctx.subExpressions[1]);
      } else if (ctx.props.storedType === 'variable') {
        const varName = (ctx.subExpressions[0].props as { varName: string })?.varName;
        s.varReg.set(varName, ctx.subExpressions[1].eval(s));
      }
      return 0;
    },
  ),
  splitExpr('check', /=>/, 2, NoPF, (s, ctx) => (ctx.subExpressions[0].eval(s) ? ctx.subExpressions[1].eval(s) : 0)),
  splitExpr('attack', /=atk(?::(\d+))?(?::(adv|dis)(\d+)?)?>/, 2,
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
    }
  ),
  splitExpr('save', /=sav:(\d+)(?::(adv|dis))?>/, 2,
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
    }
  ),
  splitExpr('gte', />=/, 2, NoPF, (s, ctx) => Number(ctx.subExpressions[0].eval(s) >= ctx.subExpressions[1].eval(s))),
  splitExpr('lte', /<=/, 2, NoPF, (s, ctx) => Number(ctx.subExpressions[0].eval(s) <= ctx.subExpressions[1].eval(s))),
  splitExpr('add', /\+/, NoMax, NoPF, (s, ctx) => sum(ctx.subExpressions.map((e) => e.eval(s)))),
  splitExpr('sub', /-(?!>)/, NoMax, NoPF, (s, ctx) => ctx.subExpressions[0].eval(s) - sum(ctx.subExpressions.slice(1).map((e) => e.eval(s)))),
  splitExpr('mul', /\*/, NoMax, NoPF, (s, ctx) => ctx.subExpressions.reduce((a, e) => a * e.eval(s), 1)),
  splitExpr('div', /\//, 2, NoPF, (s, ctx) => Math.floor(ctx.subExpressions[0].eval(s) / ctx.subExpressions[1].eval(s)) ),
  splitExpr('repeat', /#/, 2, NoPF, (s, ctx) => sum([...new Array(Number(ctx.subExpressions[0].eval(s)))].map(() => ctx.subExpressions[1].eval(s)))),
  splitExpr('reroll_lte', /@rrlte:/, 2, NoPF, (state, ctx) => {
    let droll = ctx.subExpressions[0].eval(state);
    if (droll <= ctx.subExpressions[1].eval(state)) {
      return ctx.subExpressions[0].eval(state)
    }
    return droll;
  }),
];

export const ValueExpressions = [
  valueExpr('number', /^\d+$/, (m) => ({ value: Number(m[0]) }), (s, { props }) => props.value),
  valueExpr('roll', /^(\d*)d(\d+)(?:k(h|l)(\d+))?$/,
    (m) => ({
      dice: new Array(Number(m[1] || 1)).fill(Number(m[2])),
      keep: (m[3] === 'l' ? -1 : 1) * Number(m[4] || m[1] || 1),
    }),
    (s, { props }) => {
      const sortedRolls = props.dice.map(roll).sort((a, b) => (b - a) * Math.sign(props.keep));
      const keptRolls = sortedRolls.slice(0, Math.abs(props.keep || props.dice.length));
      return sum(keptRolls);
    },
  ),
  valueExpr('roll_crit', /^(\d*)D(\d+)?$/,
    (m) => ({ dice: new Array(Number(m[1] || 1)).fill(Number(m[2])) }),
    (s, { props }) => sum(props.dice.map((d) => roll(d) + (s.crit() ? roll(d) : 0))),
  ),
  valueExpr('armor_class', /^AC$/, NoPF, (s, ctx) => s.ac),
  valueExpr('prof_bonus', /^PB$/, NoPF, (s, ctx) => s.pb),
  valueExpr('level', /^LV$/, NoPF, (s, ctx) => s.level),
  valueExpr('crit_mult', /^CM$/, NoPF, (s, ctx) => Number(s.crit()) * 1 + 1),
  valueExpr('crit_binary', /^CB$/, NoPF, (s, ctx) => Number(s.crit()) * 1),
  valueExpr('empty', /^$/, NoPF, (s, ctx) => 0 ),
  valueExpr('variable', /^\$([\d\w]+)$/,
    (m) => ({ varName: m[1] }),
    (s, ctx) => s.varReg.get(ctx.props.varName) || 0,
  ),
  valueExpr('function', /^@([\d\w]+)$/,
    (m) => ({ funcName: m[1] }),
    (s, ctx) => s.funcReg.get(ctx.props.funcName)?.eval(s) || 0,
  ),
];

export const exportedForTesting = {
  setRandomFunction: (func: () => number) => randomFunction = func,
};
