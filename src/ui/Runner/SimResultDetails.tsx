import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import SimResult from 'sim/SimResult';
import CodeBlock from 'ui/CodeBlock';

interface Props {
  simResult: SimResult;
}
const SimResultDetails: React.FC<Props> = ({ simResult }) => {
  const { simParams, simulation, stats } = simResult;
  return (
    <Box sx={{ p: 2, minWidth: 400 }}>
      <Typography>{simulation.name}</Typography>
      <CodeBlock>{simulation.rawExpression}</CodeBlock>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Typography>
          <p><b>Level:</b> {simParams.level}</p>
          <p><b>Armor Class:</b> {simParams.ac}</p>
          <p><b>Save Modifier:</b> {simParams.sm}</p>
          <p><b>Proficiency Bonus:</b> {simParams.pb}</p>
        </Typography>
        <Typography>
          <p><b>Iterations:</b> {stats.count}</p>
          <p><b>Minimum:</b> {stats.min}</p>
          <p><b>Mean Average:</b> {stats.mean.toFixed(2)}</p>
          <p><b>Maximum:</b> {stats.max}</p>
          <p><b>Standard Deviation:</b> {stats.stdev.toFixed(2)}</p>
        </Typography>
      </Box>
    </Box>
  );
};

export default SimResultDetails;
