import { parseSimExpr } from 'sim/parse';
import SimState from 'sim/SimState';

function testExpr(rawExpr: string, stateOverride?: Partial<SimState>) {
  const expr = parseSimExpr(rawExpr);
  const state = new SimState({ ac: 10, pb: 2, level: 1, sm: 0, ...stateOverride });
  stateOverride?.critStack?.forEach((v) => state.critStack.push(v));
  stateOverride?.funcReg?.forEach((v, k) => state.funcReg.set(k, v));
  stateOverride?.varReg?.forEach((v, k) => state.varReg.set(k, v));
  return expr.eval(state);
}

describe('not', () => {
  it('inverts the boolean value', () => {
    expect(testExpr('!1')).toEqual(0);
    expect(testExpr('!0')).toEqual(1);
    expect(testExpr('!3')).toEqual(0);
    expect(testExpr('!1d6')).toEqual(0);
    expect(testExpr('!(1-1)')).toEqual(1);
    expect(testExpr('!(2-1)')).toEqual(0);
    expect(testExpr('!!3')).toEqual(1);
    expect(testExpr('!!0')).toEqual(0);
  });
});

describe('negative', () => {
  it('inverts the boolean value', () => {
    expect(testExpr('-1')).toEqual(-1);
    expect(testExpr('-0')).toEqual(-0);
    expect(testExpr('-3')).toEqual(-3);
    expect(testExpr('-(1-1)')).toEqual(-0);
    expect(testExpr('-(2-1)')).toEqual(-1);
    expect(testExpr('-(-5)')).toEqual(5);
    expect(testExpr('--5')).toEqual(5);
  });
});
