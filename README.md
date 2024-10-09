# D&D Damage Simulator

https://kbromwich.github.io/dsim/

Performs simulations of attacks based on custom definitions to produce damage statistics (mean, stdev, min, max).
Much of the expression syntax is specifically for D&D 5e. However, with some extra work you might able to use it for other systems.

Simulations are defined with the following form:
```
<name>@<level(s)>: <expression>
```
Where `name` is the name of the "build", `level` is the player character level, and `expression` defines the simulation to perform.
For example:
```
GreatAxe@1: 3+PB =atk> 1D12+3
Dual Wield@1: (3+PB =atk> 1D6+3) + (3+PB =atk> 1D6)
GreatSword with GreatWeaponMaster@1: 3+PB-5 =atk> 2D6+3+10
```
