import { parseSimDef, parseSimExpr } from './parse';

describe('parseSimExpr', () => {
  it('can parse simple expressions', () => {
    parseSimExpr('3');
    parseSimExpr('1d3');
    parseSimExpr('1d3+5');
    parseSimExpr('(1d3+5)/2');
  });
});

describe('parseSimDef', () => {
  it('can parse simple sim expressions', () => {
    parseSimDef('test@1: 5');
    parseSimDef('test@1: 2d20');
    parseSimDef('test@1: 1d20 + 5');
  })
  it('can parse moderate sim expressions', () => {
    parseSimDef('GreatAxe@1: 3+PB =atk> 1D12+3');
    parseSimDef('GreatSword@1: 3+PB =atk> 2D6+3');
    parseSimDef('GreatSword with GreatWeaponMaster@1: 3+PB-5 =atk> 2D6+3+10');
  })
  it('can parse advanced sim expressions', () => {
    parseSimDef('Dual Wield@5: 2#(4+PB =atk> 1D6+3) + (3+PB =atk> 1D6)');
    parseSimDef('GreatSword with GreatWeaponFighting@1: 3+PB =atk> CM#(2#(1d6 @rrlte: 2)) + 3');
    parseSimDef('Dual Wield with a Sneak Attack@1: ($a := (3+PB =atk> 1D6+3 + 1D6)) + (3+PB =atk> 1D6 + ($a<=0 => 1D6)) + $a');
  })
});
