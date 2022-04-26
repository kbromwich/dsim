import React from 'react';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import examples from 'sim/examples';
// import { SplitExpressions, ValueExpressions } from 'sim/expressions';

const CodeBlock = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1),
  whiteSpace: 'pre',
  backgroundColor: theme.palette.divider,
}));

const Readme = () => (
  <Box sx={{ p: 2, maxWidth: 1000 }}>
    <Typography
      component="h2"
      fontFamily="serif"
      fontWeight="bold"
      gutterBottom
      variant="h4"
    >
      D&amp;D Damage Simulator
    </Typography>
    <Typography>
      <p>
        Performs simulations of attacks based on custom definitions to produce
        damage statistics (mean, stdev, min, max). Much of the expression syntax
        is specifically for D&amp;D 5e. However, with some extra work you might
        able to use it for other systems.
      </p>
      <p>
        Simulations are defined with the following form:
        <CodeBlock>{'<name>@<level(s)>: <expression>'}</CodeBlock>
      </p>
      <p>
        Where the expression is a custom definition such as in the following:
        <CodeBlock>{examples.basic}</CodeBlock>
        In the above examples, 3 is the attacking attribute modifier, while PB is the proficiency bonus (automatically calculated based on level).
        The uppercase D in the 1D6 damage roll means that the number of dice is doubled on a crit.
      </p>
      <p>
        Multiple attacks can be easily defined with # notation:
        <CodeBlock>{examples.multiAttack}</CodeBlock>
      </p>
      <p>
        Model a "build" leveling up with multiple definitions of the same name:
        <CodeBlock>{examples.multiLevel}</CodeBlock>
      </p>
      <p>
        More complex definitions are also possible:
        <CodeBlock>{examples.advanced}</CodeBlock>
      </p>
    </Typography>
    {/*
      
      TODO once expressions are properly named and have
      descriptions/explanations/examples

    <Typography>
      <p>Operator and Function Expressions:</p>
      <ul>
        {SplitExpressions.map((expr) => (
          <li>{expr.typeName}</li>
        ))}
      </ul>
      <p>Value Expressions:</p>
      <ul>
        {ValueExpressions.map((expr) => (
          <li>{expr.typeName}</li>
        ))}
      </ul>
    </Typography> */}
  </Box>
);

export default Readme;
