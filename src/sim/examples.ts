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

const multiLevel = `
# Classic warlock baseline: agonizing eldritch blast + hex
Warlock Baseline@1: 3+PB =atk> 1D10+1D6
Warlock Baseline@2-3: 3+PB =atk> 1D10+1D6+3
Warlock Baseline@4: 4+PB =atk> 1D10+1D6+4
Warlock Baseline@5-7: 2#(4+PB =atk> 1D10+1D6+4)
Warlock Baseline@8-10: 2#(5+PB =atk> 1D10+1D6+5)
Warlock Baseline@11-16: 3#(5+PB =atk> 1D10+1D6+5)
Warlock Baseline@17-20: 4#(5+PB =atk> 1D10+1D6+5)
`.trim();

const multiLine = `
Dual Wield with a Sneak Attack@1: (
  # First attack; assign result to $a1
  $a1 := 3+PB =atk> 1D6+3 + 1D6;
  # Second attack; only add sneak attack if first attack missed (has a value of 0), then assign result to $a2
  $a2 := 3+PB =atk> 1D6 + (!$a1 => 1D6);
  # Return the sum of the two attack results
  $a1 + $a2
)
`.trim();

const advanced = `
GreatAxe with Great Weapon Fighting@1: 3+PB =atk> 1D12rrle2 + 3
GreatSword with Great Weapon Fighting@1: 3+PB =atk> 2D6rrle2 + 3
GreatAxe with Advantage@1: 3+PB =atk:adv> 1D12+3
GreatAxe with Disadvantage@1: 3+PB =atk:dis> 1D12+3
GreatAxe that crits on a 19@1: 3+PB =atk:19> 1D12+3
GreatAxe with Advantage that crits on a 19@1: 3+PB =atk:19:adv> 1D12+3
Sorlock with Spirit Guardians and Booming Blade@7: (8+4+PB =sav:50> 3d8) + (4+PB =atk> 2D8+4)
`.trim();

export const DefaultRawSims = `
# Lines beginning with # are comments, and are ignored when parsing simulations
# Simulations are defined with the following form:
#   <name>@<level(s)>: <expression>

# Some straight forward examples:
${basic}
# In the above examples, 3 is the attacking attribute modifier, while PB is the
# proficiency bonus (automatically calculated based on level). The uppercase D
# in the 1D6 damage roll means that the number of dice is doubled on a crit.

# Multiple attacks can be easily defined with # notation:
${multiAttack}

# Model a "build" leveling up with multiple definitions of the same name:
${multiLevel}

# # Split up complex expressions over multiple lines with comments by wrapping the expression in parentheses:
${multiLine}

# More complex definitions are also possible...
${advanced}
`.trim();

const examples = {
  basic,
  multiAttack,
  multiLevel,
  multiLine,
  advanced,
};

export default examples;
