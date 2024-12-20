import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import CodeBlock from 'ui/CodeBlock';
import SimRun from './SimRun';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
);

interface Props {
  simResult: SimRun;
}
const SimResultDetails: React.FC<Props> = ({ simResult }) => {
  const { simParams, simulation, stats, dist } = simResult;
  if (!stats || !dist) {
    return <Typography>Not finished yet.</Typography>;
  }
  const values = dist.uniqueValues();
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const sortedDist = [];
  for (let i = minValue; i <= maxValue; i += 1) {
    sortedDist.push([i, dist.getCount(i)]);
  }
  return (
    <Box sx={{ p: 2, width: 500 }}>
      <Typography fontWeight="bold">{simulation.name}</Typography>
      <CodeBlock sx={{ whiteSpace: 'pre-wrap' }}>{simulation.rawExpression}</CodeBlock>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Typography sx={{ flex: 1 }}>
          <b>Level:</b> {simParams.level}<br/>
          <b>Armor Class:</b> {simParams.ac}<br/>
          <b>Save Modifier:</b> {simParams.sm}<br/>
          <b>Proficiency Bonus:</b> {simParams.pb}<br/>
        </Typography>
        <Typography sx={{ flex: 1 }}>
          <b>Iterations:</b> {stats.count}<br/>
          <b>Minimum:</b> {stats.min}<br/>
          <b>Mean Average:</b> {stats.mean.toFixed(2)}<br/>
          <b>Maximum:</b> {stats.max}<br/>
          <b>Standard Deviation:</b> {stats.stdev.toFixed(2)}<br/>
        </Typography>
      </Box>

      <Line
        options={{
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribution of damage outcomes',
            },
            legend: {
              display: false,
            },
          },
          scales: {
            y: { title: {
              display: true,
              text: '% of outcomes',
            } },
            x: { title: {
              display: true,
              text: 'Damage',
            } },
          },
          elements: {
            point: { radius: 0 },
          }
        }}
        data={{
          labels: sortedDist.map(([value]) => value),
          datasets: [{
            data: sortedDist.map(([, count]) => 100 * count / dist.totalCount()),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }],
        }}
      />
    </Box>
  );
};

export default SimResultDetails;
