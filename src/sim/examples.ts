
const basic = `
GreatAxe@1: 3+PB =atk> 1D12+3
GreatSword@1: 3+PB =atk> 2D6+3
Dual Wield@1: (3+PB =atk> 1D6+3) + (3+PB =atk> 1D6)
GreatSword with GreatWeaponMaster@1: 3+PB-5 =atk> 2D6+3+10
`.trim();

const multiAttack = `
GreatAxe@5: 2#(4+PB =atk> 1D12+3)
GreatSword@5: 2#(4+PB =atk> 2D6+3)
Dual Wield@5: 2#(4+PB =atk> 1D6+3) + (3+PB =atk> 1D6)
`.trim();

const advanced = `
GreatAxe with Great Weapon Fighting@1: 3+PB =atk> CM#(1d12 @rrlte: 2) + 3
GreatSword with Great Weapon Fighting@1: 3+PB =atk> CM#(2#(1d6 @rrlte: 2)) + 3
GreatAxe with Advantage@1: 3+PB =atk:adv> 1D12+3
GreatAxe with Disadvantage@1: 3+PB =atk:dis> 1D12+3
GreatAxe that crits on a 19@1: 3+PB =atk:19> 1D12+3
GreatAxe with Advantage that crits on a 19@1: 3+PB =atk:19:adv> 1D12+3
Dual Wield with a Sneak Attack@1: ($a := (3+PB =atk> 1D6+3 + 1D6)) + (3+PB =atk> 1D6 + ($a<=0 => 1D6)) + $a
Sorlock with Spirit Guardians and Booming Blade@7: (8+4+PB =sav:50> 3d8) + (4+PB =atk> 2D8+4)
`.trim();

const examples = {
  basic,
  multiAttack,
  advanced
};

export default examples;
