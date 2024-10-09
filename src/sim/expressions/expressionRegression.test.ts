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

describe('regression', () => {
  it('functions and variables interact correctly', () => {
    expect(testExpr('(1=>3)+(1=>2)')).toEqual(5);
    expect(testExpr('(@s:=!$d=>6);(1=>3)+(1=>2)')).toEqual(5);
    expect(testExpr('(@s:=6)+@s')).toEqual(6);
    expect(testExpr('(@s:=6);@s')).toEqual(6);
    expect(testExpr('(@s:=6);2+@s')).toEqual(8);
    expect(testExpr('(@s:=6);(1=>3+@s)+(1=>2)')).toEqual(11);
    expect(testExpr('(@s:=(!$d)=>6);(1=>3+@s)+(1=>2)')).toEqual(11);
    expect(testExpr('(@s:=!$d=>6);(1=>3+@s)+(1=>2)')).toEqual(11);
    expect(testExpr('(@s:=($d:=6)+$d);2+@s')).toEqual(8);
    expect(testExpr('(@s:=((!$d)=>($d:=6)+$d));2+@s')).toEqual(8);
    expect(testExpr('(@s:=(!$d=>($d:=6)+$d));@s')).toEqual(6);
    expect(testExpr('(@s:=!$d=>($d:=6)+$d);(1=>3+@s)+(1=>2+@s)')).toEqual(11);
    expect(testExpr('($a1:=1=>3+5;$a2:=1=>3+(!$a1=>6);$a1+$a2)')).toEqual(11);
    expect(testExpr('($a1:=0=>3+5;$a2:=1=>3+(!$a1=>6);$a1+$a2)')).toEqual(9);
  });
  it('negative is parsed correctly (not parsed as subtract inappropriately)', () => {
    expect(testExpr('1-2')).toEqual(-1);
    expect(testExpr('-1-2')).toEqual(-3);
    expect(testExpr('-1--2')).toEqual(1);
    expect(testExpr('-1+-2')).toEqual(-3);
    expect(testExpr('-1/-2')).toEqual(0);
    expect(testExpr('-1<-1')).toEqual(0);
    expect(testExpr('-1<=-1')).toEqual(1);
    expect(testExpr('-1>-1')).toEqual(0);
    expect(testExpr('-1>=-1')).toEqual(1);
    expect(testExpr('-1==-1')).toEqual(1);
    expect(testExpr('-1=>-1')).toEqual(-1);
    expect(testExpr('-1&&-2')).toEqual(-2);
    expect(testExpr('-1||-1')).toEqual(-1);
  });
});
