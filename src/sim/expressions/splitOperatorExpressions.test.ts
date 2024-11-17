import calculateStats from 'sim/Stats';
import { MutableDistribution } from 'util/Distribution';
import mulberry32 from 'util/mulberry32';
import Expression from './Expression';
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

// Split expressions
describe('discard', () => {
  it('counts the left operand as 0', () => {
    expect(testExpr('2;3')).toEqual(3);
    expect(testExpr('AC;PB')).toEqual(2);
    expect(testExpr('(0=>1);(1=>1)')).toEqual(1);
    expect(testExpr('$a:=2;4')).toEqual(4);
  });
});

describe('assign (:=)', () => {
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
    expect(testExpr('(@a:=12)+@a')).toEqual(12);
  });
});

describe('assign (=)', () => {
  it('assigns a static number value to var state', () => {
    const expr = parseSimExpr('$testVar=123');
    const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state)).toBe(123);
    expect([...state.varReg.entries()]).toEqual([['testVar', 123]]);
  });
  it('assigns the result of an more complex expression to var state', () => {
    const expr = parseSimExpr('$otherVar=(1+2+3)+PB');
    const state1 = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state1)).toBe(8);
    expect([...state1.varReg.entries()]).toEqual([['otherVar', 8]]);
    const state2 = new SimState({ ac: 10, pb: 3, level: 1, sm: 0 });
    expect(expr.eval(state2)).toBe(9);
    expect([...state2.varReg.entries()]).toEqual([['otherVar', 9]]);
  });
  it('assigns an expression to func state', () => {
    const expr = parseSimExpr('@testFunc=(1+2+3)');
    const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state)).toBe(6);
    expect([...state.funcReg.keys()]).toEqual(['testFunc']);
    expect(state.funcReg.get('testFunc')).toBeInstanceOf(Expression);
    expect(state.funcReg.get('testFunc')?.eval(state)).toBe(6);
    expect(testExpr('(@a=12)+@a')).toEqual(24);
  });
});

// describe('assign if non-zero or already assigned', () => {
//   it('assigns to var state when already set to non-zero value', () => {
//     const expr = parseSimExpr('$testVar&=123');
//     const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
//     state.varReg.set('testVar', 3);
//     expect(expr.eval(state)).toBe(123);
//     expect([...state.varReg.entries()]).toEqual([['testVar', 123]]);
//   });
//   it('does not assign to var state when not already set', () => {
//     const expr = parseSimExpr('$testVar&=123');
//     const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
//     expect(expr.eval(state)).toBe(0);
//     expect([...state.varReg.entries()]).toEqual([]);
//   });
//   it('does not assign to var state when already set to 0', () => {
//     const expr = parseSimExpr('$testVar&=123');
//     const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
//     state.varReg.set('testVar', 0);
//     expect(expr.eval(state)).toBe(0);
//     expect([...state.varReg.entries()]).toEqual([['testVar', 0]]);
//   });
// });

// describe('assign if zero or not already assigned', () => {
//   it('assigns to var state when already set to non-zero value', () => {
//     const expr = parseSimExpr('$testVar|=123');
//     const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
//     state.varReg.set('testVar', 3);
//     expect(expr.eval(state)).toBe(3);
//     expect([...state.varReg.entries()]).toEqual([['testVar', 3]]);
//   });
//   it('does not assign to var state when not already set', () => {
//     const expr = parseSimExpr('$testVar|=123');
//     const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
//     expect(expr.eval(state)).toBe(123);
//     expect([...state.varReg.entries()]).toEqual([['testVar', 123]]);
//   });
//   it('does not assign to var state when already set to 0', () => {
//     const expr = parseSimExpr('$testVar|=321');
//     const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
//     state.varReg.set('testVar', 0);
//     expect(expr.eval(state)).toBe(321);
//     expect([...state.varReg.entries()]).toEqual([['testVar', 321]]);
//   });
// });

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
  it('resolves to 0 when on a nat 1 regardless of total vs AC', () => {
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

describe('or', () => {
  it('outputs the first operand when the first is non-zero', () => {
    expect(testExpr('1||1')).toEqual(1);
    expect(testExpr('1||0')).toEqual(1);
    expect(testExpr('1||5')).toEqual(1);
    expect(testExpr('3||5')).toEqual(3);
    expect(testExpr('3||0')).toEqual(3);
    expect(testExpr('(3-3)||4')).toEqual(4);
    expect(testExpr('(3-4)||(2+5)')).toEqual(-1);
  });
  it('outputs the second operand when the first is zero', () => {
    expect(testExpr('0||1')).toEqual(1);
    expect(testExpr('0||0')).toEqual(0);
    expect(testExpr('0||5')).toEqual(5);
  });
  it('doesn\'t evaluate the second operand when the first is non-zero', () => {
    const expr = parseSimExpr('7||($a:=123)');
    const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state)).toBe(7);
    expect([...state.varReg.entries()]).toEqual([]);
  });
});

describe('and', () => {
  it('outputs the second operand when the first is non-zero', () => {
    expect(testExpr('1&&1')).toEqual(1);
    expect(testExpr('1&&0')).toEqual(0);
    expect(testExpr('1&&5')).toEqual(5);
    expect(testExpr('3&&5')).toEqual(5);
    expect(testExpr('3&&0')).toEqual(0);
  });
  it('outputs zero when the first operand is zero', () => {
    expect(testExpr('0&&1')).toEqual(0);
    expect(testExpr('0&&0')).toEqual(0);
    expect(testExpr('0&&5')).toEqual(0);
  });
  it('doesn\'t evaluate the second operand when the first is zero', () => {
    const expr = parseSimExpr('0&&($a:=123)');
    const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0 });
    expect(expr.eval(state)).toBe(0);
    expect([...state.varReg.entries()]).toEqual([]);
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

describe('gt', () => {
  it('resolves to true (1) when first is greater than second operand', () => {
    expect(testExpr('1>0')).toEqual(1);
    expect(testExpr('321>123')).toEqual(1);
    expect(testExpr('0>-1')).toEqual(1);
  });
  it('resolves to false (0) when first is equal to second operand', () => {
    expect(testExpr('0>0')).toEqual(0);
    expect(testExpr('1>1')).toEqual(0);
    expect(testExpr('123>123')).toEqual(0);
    expect(testExpr('-1>-1')).toEqual(0);
  });
  it('resolves to false (0) when first is less than second operand', () => {
    expect(testExpr('0>1')).toEqual(0);
    expect(testExpr('123>321')).toEqual(0);
    expect(testExpr('-1>0')).toEqual(0);
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

describe('lt', () => {
  it('resolves to true (1) when first is less than second operand', () => {
    expect(testExpr('0<1')).toEqual(1);
    expect(testExpr('123<321')).toEqual(1);
    expect(testExpr('-1<0')).toEqual(1);
  });
  it('resolves to false (0) when first is equal to second operand', () => {
    expect(testExpr('0<0')).toEqual(0);
    expect(testExpr('1<1')).toEqual(0);
    expect(testExpr('123<123')).toEqual(0);
    expect(testExpr('-1<-1')).toEqual(0);
  });
  it('resolves to false (0) when first is greater than second operand', () => {
    expect(testExpr('1<0')).toEqual(0);
    expect(testExpr('321<123')).toEqual(0);
    expect(testExpr('0<-1')).toEqual(0);
  });
});

describe('eq', () => {
  it('resolves to true (1) when first is equal to second operand', () => {
    expect(testExpr('0==0')).toEqual(1);
    expect(testExpr('1==1')).toEqual(1);
    expect(testExpr('123==123')).toEqual(1);
    expect(testExpr('-1==-1')).toEqual(1);
  });
  it('resolves to false (0) when first is less than second operand', () => {
    expect(testExpr('0==1')).toEqual(0);
    expect(testExpr('123==321')).toEqual(0);
    expect(testExpr('-1==0')).toEqual(0);
  });
  it('resolves to false (0) when first is greater than second operand', () => {
    expect(testExpr('1==0')).toEqual(0);
    expect(testExpr('321==123')).toEqual(0);
    expect(testExpr('0==-1')).toEqual(0);
  });
});

describe('neq', () => {
  it('resolves to false (0) when first is equal to second operand', () => {
    expect(testExpr('0!=0')).toEqual(0);
    expect(testExpr('1!=1')).toEqual(0);
    expect(testExpr('123!=123')).toEqual(0);
    expect(testExpr('-1!=-1')).toEqual(0);
  });
  it('resolves to true (1) when first is less than second operand', () => {
    expect(testExpr('0!=1')).toEqual(1);
    expect(testExpr('123!=321')).toEqual(1);
    expect(testExpr('-1!=0')).toEqual(1);
  });
  it('resolves to true (1) when first is greater than second operand', () => {
    expect(testExpr('1!=0')).toEqual(1);
    expect(testExpr('321!=123')).toEqual(1);
    expect(testExpr('0!=-1')).toEqual(1);
  });
});

describe('add', () => {
  it('adds two simple expressions together', () => {
    expect(testExpr('0+1')).toEqual(1);
    expect(testExpr('123+321')).toEqual(444);
    expect(testExpr('-1+1')).toEqual(0);
    expect(testExpr('1+-1')).toEqual(0);
    expect(testExpr('-1+-1')).toEqual(-2);
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
    expect(testExpr('1--1')).toEqual(2);
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
    expect(testExpr('2*-3')).toEqual(-6);
    expect(testExpr('-2*3')).toEqual(-6);
    expect(testExpr('-2*-3')).toEqual(6);
  });
});

describe('div', () => {
  it('divides the first expr by the second expr', () => {
    expect(testExpr('6/2')).toEqual(3);
    expect(testExpr('AC/PB')).toEqual(5);
    expect(testExpr('6/-2')).toEqual(-3);
  });
});

describe('repeat', () => {
  it('repeats (and sums) the second expr a number of times equal the first expr', () => {
    expect(testExpr('2#3')).toEqual(6);
    expect(testFixedRngExpr([17, 7], '2#1d6')).toEqual(7);
    expect(testFixedRngExpr([4, 20, 14, 7], '2#(5=atk>1D6+2)')).toEqual(8);
  });
  it('gives a useful error message for negeative repetitions', () => {
    expect(() => testExpr('-1#3')).toThrow('Cannot repeat a negative (-1) number of times: -1#3');
  });
});
