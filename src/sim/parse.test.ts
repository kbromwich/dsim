import { parseSimDef, parseSimDefsScript, parseSimExpr } from './parse';

describe('parseSimExpr', () => {
  it('can parse simple expressions', () => {
    parseSimExpr('3');
    parseSimExpr('1d3');
    parseSimExpr('1d3+5');
    parseSimExpr('(1d3+5)/2');
  });
});

describe('parseSimDef', () => {
  const testParseSimDef = (simDef: string, errors?: string[]) => {
    const parsedSims = parseSimDef({ definition: simDef });
    const actualErrors = parsedSims.map((sim) => sim.error).filter((e) => e);
    expect(actualErrors).toEqual(errors || []);
  };
  it('can parse simple sim expressions', () => {
    testParseSimDef('test@1: 5');
    testParseSimDef('test@1: 2d20');
    testParseSimDef('test@1: 1d20 + 5');
  });
  it('can parse moderate sim expressions', () => {
    testParseSimDef('GreatAxe@1: 3+PB =atk> 1D12+3');
    testParseSimDef('GreatSword@1: 3+PB =atk> 2D6+3');
    testParseSimDef('GreatSword with GreatWeaponMaster@1: 3+PB-5 =atk> 2D6+3+10');
  });
  it('can parse advanced sim expressions', () => {
    testParseSimDef('Dual Wield@5: 2#(4+PB =atk> 1D6+3) + (3+PB =atk> 1D6)');
    testParseSimDef('GreatSword with GreatWeaponFighting@1: 3+PB =atk> 2D6rrle2 + 3');
    testParseSimDef('Dual Wield with a Sneak Attack@1: ($a := (3+PB =atk> 1D6+3 + 1D6)) + (3+PB =atk> 1D6 + ($a<=0 => 1D6)) + $a');
  });
});

describe('parseSimDefsScript', () => {
  it('can parse simple sim expressions', () => {
    const parsedSims = parseSimDefsScript(`
      test@1: 5
      test@2: 2d20
      test@3: 1d20 + 5
    `);
    expect(parsedSims.names).toEqual(['test']);
    expect(parsedSims.sims.test.length).toEqual(3);
    expect(parsedSims.errors).toEqual([]);
  });
  it('can parse multiline sim expressions', () => {
    const parsedSims = parseSimDefsScript(`
      test@1: (
        3 + PB
        =atk>
        1D12 + 3
        + 1d6
      )
      test@2: 2d20
      test@3: 1d20 + 5
      test2@1: (
        4+PB =atk> 1D6+4 
        + 2+PB =atk> 1D12+2
      )
    `);
    expect(parsedSims.names).toEqual(['test', 'test2']);
    expect(parsedSims.sims.test.length).toEqual(3);
    expect(parsedSims.sims.test2.length).toEqual(1);
    expect(parsedSims.errors).toEqual([]);
  });
  it('reports unended multiline expressions as errors without clobbering following definitions', () => {
    const parsedSims = parseSimDefsScript(`
      test@1: (
        3+PB =atk> 1D12+3
        + 1d6
      
      test@2: 2d20
      test@3: 1d20 + 5
      test2@1: (
        4+PB =atk> 1D6+4 
        + 2+PB =atk> 1D12+2
      )test@3: 1d6 + 2
      test3@1: (
        4+PB =atk> 1D6+4 
      test (4) @ 1 - 3 : 1d6 + 3
    `);
    expect(parsedSims.names).toEqual(['test', ')test', 'test (4) ']);
    expect(parsedSims.sims.test.length).toEqual(2);
    expect(parsedSims.sims[')test'].length).toEqual(1);
    expect(parsedSims.errors).toEqual([
      { lineStart: 1, lineCount: 4, message: 'Unbalanced parentheses in expression "(3+PB=atk>1D12+3+1d6"' },
      { lineStart: 7, lineCount: 3, message: 'Unbalanced parentheses in expression "(4+PB=atk>1D6+4+2+PB=atk>1D12+2"' },
      { lineStart: 11, lineCount: 2, message: 'Unbalanced parentheses in expression "(4+PB=atk>1D6+4"' },
    ]);
  });
});