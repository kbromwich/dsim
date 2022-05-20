import calculateStats from 'sim/Stats';
import { MutableDistribution } from 'util/Distribution';
import mulberry32 from 'util/mulberry32';
import { exportedForTesting } from './expressionUtils';
import { parseSimExpr } from 'sim/parse';
import SimState from 'sim/SimState';

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
  const results = new MutableDistribution();
  const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0, ...stateOverride });
  for (let i = 0; i < runs; i++) {
    state.reset();
    stateOverride?.critStack?.forEach((v) => state.critStack.push(v));
    stateOverride?.funcReg?.forEach((v, k) => state.funcReg.set(k, v));
    stateOverride?.varReg?.forEach((v, k) => state.varReg.set(k, v));
    results.increment(expr.eval(state));
  }
  const stats = calculateStats(results);
  return {
    min: stats.min.toFixed(acc),
    max: stats.max.toFixed(acc),
    mean: stats.mean.toFixed(acc),
    stdev: stats.stdev.toFixed(acc),
  };
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
  it.skip('(regression) produces correct output for some standard dice', () => {
    expect(testRngExpr('1d4', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('1d8', 100, 1)).toEqual({ min: '1.0', max: '8.0', mean: '4.6', stdev: '2.4' });
    expect(testRngExpr('1d20', 100, 1)).toEqual({ min: '1.0', max: '20.0', mean: '10.7', stdev: '6.1' });
  });
  it.skip('(regression) produces correct output for keep lowest/highest', () => {
    expect(testRngExpr('1d4kl1', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('1d4kh1', 100, 1)).toEqual({ min: '1.0', max: '4.0', mean: '2.5', stdev: '1.1' });
    expect(testRngExpr('2d20kh1', 100, 1)).toEqual({ min: '2.0', max: '20.0', mean: '14.2', stdev: '4.7' });
    expect(testRngExpr('2d20kl1', 100, 1)).toEqual({ min: '1.0', max: '19.0', mean: '6.6', stdev: '4.5' });
    expect(testRngExpr('4d20kl2', 100, 1)).toEqual({ min: '3.0', max: '35.0', mean: '12.2', stdev: '6.3' });
  });
  it.skip('(regression) produces correct output for rrle/rrlt/rrge/rreq', () => {
    expect(testRngExpr('2d6rrle2', 100, 1)).toEqual({ min: '4.0', max: '12.0', mean: '8.4', stdev: '2.0' });
    expect(testRngExpr('1d12rrle2', 100, 1)).toEqual({ min: '1.0', max: '12.0', mean: '7.8', stdev: '3.1' });
    expect(testRngExpr('2d6rrlt3', 100, 1)).toEqual({ min: '4.0', max: '12.0', mean: '8.4', stdev: '2.0' });
    expect(testRngExpr('1d12rrlt3', 100, 1)).toEqual({ min: '1.0', max: '12.0', mean: '7.8', stdev: '3.1' });
    expect(testRngExpr('2d6rrge5', 100, 1)).toEqual({ min: '2.0', max: '11.0', mean: '5.5', stdev: '2.1' });
    expect(testRngExpr('1d12rrge8', 100, 1)).toEqual({ min: '1.0', max: '12.0', mean: '4.9', stdev: '3.3' });
    expect(testRngExpr('2d6rrgt4', 100, 1)).toEqual({ min: '2.0', max: '11.0', mean: '5.5', stdev: '2.1' });
    expect(testRngExpr('1d12rrgt7', 100, 1)).toEqual({ min: '1.0', max: '12.0', mean: '4.9', stdev: '3.3' });
    expect(testRngExpr('2d6rreq1', 100, 1)).toEqual({ min: '3.0', max: '12.0', mean: '8.1', stdev: '2.1' });
    expect(testRngExpr('1d12rreq1', 100, 1)).toEqual({ min: '1.0', max: '12.0', mean: '7.1', stdev: '3.4' });
  });
  it('(regression) produces correct output for combination operations', () => {
    expect(testRngExpr('4d6rrle2kh2', 100, 1)).toEqual({ min: '6.0', max: '12.0', mean: '10.3', stdev: '1.3' });
    expect(testRngExpr('4d6rreq1kh3', 100, 1)).toEqual({ min: '7.0', max: '18.0', mean: '13.2', stdev: '2.5' });
    expect(testRngExpr('5d8kl2rreq1kh1', 100, 1)).toEqual({ min: '2.0', max: '8.0', mean: '4.3', stdev: '1.8' });
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
