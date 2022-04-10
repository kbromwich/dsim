import calculateStats from 'sim/Stats';
import mulberry32 from 'util/mulberry32';
import Expression from './Expression';
import { exportedForTesting } from './expressions';
import { parseSimExpr } from './parse';
import SimState from './SimState';

const RandomTestSeed = 13649713898; // Do not change or tests will break!

function testExpr(rawExpr: string, stateOverride?: Partial<SimState>) {
  const expr = parseSimExpr(rawExpr);
  const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0, ...stateOverride });
  stateOverride?.critStack?.forEach((v) => state.critStack.push(v));
  stateOverride?.funcReg?.forEach((v, k) => state.funcReg.set(k, v));
  stateOverride?.varReg?.forEach((v, k) => state.varReg.set(k, v));
  return expr.eval(state);
}

function testRngExpr(rawExpr: string, runs: number, acc: number, stateOverride?: Partial<SimState>, rng?: () => number) {
  exportedForTesting.setRandomFunction(rng || mulberry32(RandomTestSeed));
  const expr = parseSimExpr(rawExpr);
  const results = [];
  const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0, ...stateOverride });
  for (let i = 0; i < runs; i++) {
    state.reset();
    stateOverride?.critStack?.forEach((v) => state.critStack.push(v));
    stateOverride?.funcReg?.forEach((v, k) => state.funcReg.set(k, v));
    stateOverride?.varReg?.forEach((v, k) => state.varReg.set(k, v));
    results.push(expr.eval(state));
  }
  const stats = calculateStats(results);
  return {
    min: stats.min.toFixed(acc),
    max: stats.max.toFixed(acc),
    mean: stats.mean.toFixed(acc),
    stdev: stats.stdev.toFixed(acc),
  };
}

function testFixedRngExpr(d20Value: number | number[], rawExpr: string, stateOverride?: Partial<SimState>) {
  let counter = 0;
  let rngFunc;
  if (Array.isArray(d20Value)) {
    rngFunc = () => {
      const result = (d20Value[counter % d20Value.length] - 1) / 20;
      counter += 1;
      return result;
    };
  } else {
    rngFunc = () => (d20Value - 1) / 20;
  }
  return Number(testRngExpr(rawExpr, 1, 99, stateOverride, rngFunc).mean);
}

// Value expressions
describe('number', () => {
  it('produces correct output for integers', () => {
    expect(testExpr('5')).toEqual(5);
    expect(testExpr('123')).toEqual(123);
  });
  it('produces correct output for negative integers', () => {
    expect(testExpr('-5')).toEqual(-5);
    expect(testExpr('-123')).toEqual(-123);
  });
  it('fails to parse floats', () => {
    expect(() => parseSimExpr('0.5')).toThrow();
  });
});

describe('roll', () => {
  it('(regression) produces correct output for some standard dice', () => {
    expect(testRngExpr('1d4', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('1d8', 100, 1)).toEqual({ min: '1.0', max: '8.0', mean: '4.6', stdev: '2.4' });
    expect(testRngExpr('1d20', 100, 1)).toEqual({ min: '1.0', max: '20.0', mean: '10.7', stdev: '6.1' });
  });
  it('(regression) produces correct output for keep lowest/highest', () => {
    expect(testRngExpr('1d4kl1', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('1d4kh1', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('2d20kh1', 100, 1)).toEqual({ min: '2.0', max: '20.0', mean: '14.2', stdev: '4.7' });
    expect(testRngExpr('2d20kl1', 100, 1)).toEqual({ min: '1.0', max: '19.0', mean: '6.6', stdev: '4.5' });
    expect(testRngExpr('4d20kl2', 100, 1)).toEqual({ min: '3.0', max: '35.0', mean: '12.2', stdev: '6.3' });
  });
});

describe('roll_crit', () => {
  it('(regression) produces correct output for some standard dice', () => {
    expect(testRngExpr('1D4', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('1D8', 100, 1)).toEqual({ min: '1.0', max: '8.0', mean: '4.6', stdev: '2.4' });
    expect(testRngExpr('1D20', 100, 1)).toEqual({ min: '1.0', max: '20.0', mean: '10.7', stdev: '6.1' });
  });
});

describe('armor_class', () => {
  it('provides the appropriate AC value', () => {
    expect(testExpr('AC', { ac: 10 })).toEqual(10);
    expect(testExpr('AC', { ac: 15 })).toEqual(15);
    expect(testExpr('AC', { ac: 21 })).toEqual(21);
  });
});

describe('prof_bonus', () => {
  it('provides the appropriate PB value', () => {
    expect(testExpr('PB', { pb: 2 })).toEqual(2);
    expect(testExpr('PB', { pb: 3 })).toEqual(3);
    expect(testExpr('PB', { pb: 4 })).toEqual(4);
  });
});

describe('level', () => {
  it('provides the appropriate level value', () => {
    expect(testExpr('LV', { level: 1 })).toEqual(1);
    expect(testExpr('LV', { level: 3 })).toEqual(3);
    expect(testExpr('LV', { level: 8 })).toEqual(8);
  });
});

describe('crit_mult', () => {
  it('provides the appropriate CM value', () => {
    expect(testExpr('CM', { critStack: [false] })).toEqual(1);
    expect(testExpr('CM', { critStack: [true] })).toEqual(2);
    expect(testExpr('CM', { critStack: [true, false] })).toEqual(1);
    expect(testExpr('CM', { critStack: [false, true] })).toEqual(2);
  });
});

describe('crit_binary', () => {
  it('provides the appropriate CB value', () => {
    expect(testExpr('CB', { critStack: [false] })).toEqual(0);
    expect(testExpr('CB', { critStack: [true] })).toEqual(1);
    expect(testExpr('CB', { critStack: [true, false] })).toEqual(0);
    expect(testExpr('CB', { critStack: [false, true] })).toEqual(1);
  });
});

describe('empty', () => {
  it('evaluates to 0', () => {
    expect(testExpr('')).toEqual(0);
  });
});

describe('variable', () => {
  it('evaluates to the stored variable value', () => {
    expect(testExpr('$testName', { varReg: new Map([['testName', 3]]) })).toEqual(3);
    expect(testExpr('$other', { varReg: new Map([['other', 8]]) })).toEqual(8);
  });
  it('evaluates to 0 for a variable that has not been stored', () => {
    expect(testExpr('$testName', { varReg: new Map([]) })).toEqual(0);
  });
});

describe('function', () => {
  it('evaluates the stored expression', () => {
    expect(testExpr('@testFunc', { funcReg: new Map([['testFunc', parseSimExpr('5')]]) })).toEqual(5);
    expect(testExpr('@otherFunc', { ac: 17, funcReg: new Map([['otherFunc', parseSimExpr('AC')]]) })).toEqual(17);
  });
  it('fails to execute when using a function before being defined', () => {
    expect(() => testExpr('!testFunc', { funcReg: new Map([]) })).toThrow();
  });
});

// Split expressions
describe('assign', () => {
  it('assigns a static number value to var state', () => {
    const expr = parseSimExpr('$testVar:=123');
    const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state)).toBe(0);
    expect([...state.varReg.entries()]).toEqual([['testVar', 123]]);
  });
  it('assigns the result of an more complex expression to var state', () => {
    const expr = parseSimExpr('$otherVar:=(1+2+3)+PB');
    const state1 = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state1)).toBe(0);
    expect([...state1.varReg.entries()]).toEqual([['otherVar', 8]]);
    const state2 = new SimState({ ac: 10, pb: 3, level: 1, sm: 0 });
    expect(expr.eval(state2)).toBe(0);
    expect([...state2.varReg.entries()]).toEqual([['otherVar', 9]]);
  });
  it('assigns an expression to func state', () => {
    const expr = parseSimExpr('@testFunc:=(1+2+3)');
    const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state)).toBe(0);
    expect([...state.funcReg.keys()]).toEqual(['testFunc']);
    expect(state.funcReg.get('testFunc')).toBeInstanceOf(Expression);
    expect(state.funcReg.get('testFunc')?.eval(state)).toBe(6);
  });
});

describe('check', () => {
  it('resolves to zero when checked expression is falsy (0)', () => {
    expect(testExpr('0=>123')).toEqual(0);
  });
  it('resolves to second expression value when checked expression is truthy (nonzero)', () => {
    expect(testExpr('1=>123')).toEqual(123);
    expect(testExpr('-1=>123')).toEqual(123);
    expect(testExpr('321=>123')).toEqual(123);
  });
});

describe('attack', () => {
  it('resolves the second expression when the first expression (plus dice roll) is greater than (or equal to) the AC', () => {
    expect(testFixedRngExpr(5, '5=atk>10')).toEqual(10);
    expect(testFixedRngExpr(15, '5=atk>10')).toEqual(10);
    expect(testFixedRngExpr(10, '10=atk>10', { ac: 20 })).toEqual(10);
  });
  it('resolves to 0 when the first expression is less than the AC', () => {
    expect(testFixedRngExpr(4, '5=atk>10')).toEqual(0);
    expect(testFixedRngExpr(9, '10=atk>10', { ac: 20 })).toEqual(0);
  });
  it('resolves the attack on a nat 20 regardless of total vs AC', () => {
    expect(testFixedRngExpr(20, '5=atk>10')).toEqual(10);
    expect(testFixedRngExpr(20, '3=atk>10', { ac: 25 })).toEqual(10);
    expect(testFixedRngExpr(20, '1=atk>10', { ac: 30 })).toEqual(10);
  });
  it.skip('resolves to 0 when on a nat 1 regardless of total vs AC', () => { // TODO: Fix this case!
    expect(testFixedRngExpr(1, '5=atk>10')).toEqual(0);
    expect(testFixedRngExpr(1, '9=atk>10')).toEqual(0);
    expect(testFixedRngExpr(1, '20=atk>10', { ac: 1 })).toEqual(0);
  });
});

describe('save', () => {
  it('resolves to second expr when the (dice roll + save mod) is < (first expr)', () => {
    expect(testFixedRngExpr(4, '5=sav:50>10')).toEqual(10);
    expect(testFixedRngExpr(10, '16=sav:50>10', { sm: 5 })).toEqual(10);
  });
  it('resolves to 0 when the (dice roll + save mod) is >= (first expr) and result modifier is 0(%)', () => {
    expect(testFixedRngExpr(8, '5=sav:0>10')).toEqual(0);
    expect(testFixedRngExpr(10, '25=sav:0>10', { sm: 20 })).toEqual(0);
  });
  it('resolves to half (round down) when the (dice roll + save mod) is >= (first expr) and result modifier is 50(%)', () => {
    expect(testFixedRngExpr(5, '5=sav:50>10')).toEqual(5);
    expect(testFixedRngExpr(10, '15=sav:50>11', { sm: 5 })).toEqual(5);
  });
});

describe('gte', () => {
  it('resolves to true (1) when first is greater than second operand', () => {
    expect(testExpr('1>=0')).toEqual(1);
    expect(testExpr('321>=123')).toEqual(1);
    expect(testExpr('0>=-1')).toEqual(1);
  });
  it('resolves to true (1) when first is equal to second operand', () => {
    expect(testExpr('0>=0')).toEqual(1);
    expect(testExpr('1>=1')).toEqual(1);
    expect(testExpr('123>=123')).toEqual(1);
    expect(testExpr('-1>=-1')).toEqual(1);
  });
  it('resolves to false (1) when first is less than second operand', () => {
    expect(testExpr('0>=1')).toEqual(0);
    expect(testExpr('123>=321')).toEqual(0);
    expect(testExpr('-1>=0')).toEqual(0);
  });
});

describe('lte', () => {
  it('resolves to true (1) when first is less than second operand', () => {
    expect(testExpr('0<=1')).toEqual(1);
    expect(testExpr('123<=321')).toEqual(1);
    expect(testExpr('-1<=0')).toEqual(1);
  });
  it('resolves to true (1) when first is equal to second operand', () => {
    expect(testExpr('0<=0')).toEqual(1);
    expect(testExpr('1<=1')).toEqual(1);
    expect(testExpr('123<=123')).toEqual(1);
    expect(testExpr('-1<=-1')).toEqual(1);
  });
  it('resolves to false (1) when first is greater than second operand', () => {
    expect(testExpr('1<=0')).toEqual(0);
    expect(testExpr('321<=123')).toEqual(0);
    expect(testExpr('0<=-1')).toEqual(0);
  });
});

describe('add', () => {
  it('adds two simple expressions together', () => {
    expect(testExpr('0+1')).toEqual(1);
    expect(testExpr('123+321')).toEqual(444);
    expect(testExpr('-1+1')).toEqual(0);
    expect(testExpr('AC+PB')).toEqual(12);
  });
  it('adds two complex expressions together', () => {
    expect(testExpr('(0=>1)+(1=>1)')).toEqual(1);
  });
  it('adds more than two expressions together', () => {
    expect(testExpr('0+1+2+3+AC')).toEqual(16);
  });
});

describe('sub', () => {
  it('subtracts the second expression from the first', () => {
    expect(testExpr('1-0')).toEqual(1);
    expect(testExpr('0-1')).toEqual(-1);
    expect(testExpr('321-123')).toEqual(198);
    // expect(testExpr('1--1')).toEqual(2); // TODO: Fix this case!
    expect(testExpr('1-(-1)')).toEqual(2);
    expect(testExpr('AC-PB')).toEqual(8);
    expect(testExpr('(1=>1)-(0=>1)')).toEqual(1);
  });
  it('adds more than two expressions together', () => {
    expect(testExpr('0+1+2+3+AC')).toEqual(16);
  });
});

describe('mul', () => {
  it('multiplies two expressions together', () => {
    expect(testExpr('2*3')).toEqual(6);
    expect(testExpr('AC*PB')).toEqual(20);
    expect(testExpr('(0=>1)*(1=>1)')).toEqual(0);
  });
});

describe('div', () => {
  it('divides the first expr by the second expr', () => {
    expect(testExpr('6/2')).toEqual(3);
    expect(testExpr('AC/PB')).toEqual(5);
    // expect(testExpr('6/-2')).toEqual(-3); // TODO: Fix this case!
  });
});

describe('repeat', () => {
  it('repeats (and sums) the second expr a number of times equal the first expr', () => {
    expect(testExpr('2#3')).toEqual(6);
    expect(testFixedRngExpr([17, 7], '2#1d6')).toEqual(7);
    expect(testFixedRngExpr([4, 20, 14, 7], '2#(5=atk>1D6+2)')).toEqual(8);
  });
});

describe('reroll_lte', () => {
  it('reruns second expr if the result is less than the first expr', () => {
    expect(testFixedRngExpr([6, 3], '1d20@rrlte:3')).toEqual(6);
    expect(testFixedRngExpr([2, 7], '1d20@rrlte:3')).toEqual(7);
    expect(testFixedRngExpr([2, 2], '2d20@rrlte:3')).toEqual(4);
  });
});
