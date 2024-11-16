import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  Colors,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import Box from '@mui/material/Box';

import { arrayBinned, arrayUnique } from 'util/arrays';

import SimRun from './SimRun';

ChartJS.register(
  CategoryScale,
  Colors,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
);

interface Props {
  simResults: SimRun[];
  title: string;
}
const SimResultComparison: React.FC<Props> = ({ simResults, title }) => {
  const levels = arrayUnique(simResults.map((sim) => sim.simParams.level));
  const resultsByName = arrayBinned(simResults, (r) => r.simulation.name)
  
  return (
    <Box sx={{ p: 2, width: 600 }}>
      <Line
        options={{
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Comparison of damage against ${title}`,
            },
            legend: {
              display: true,
              position: 'bottom',
            },
          },
          scales: {
            y: { title: {
              display: true,
              text: 'Damage',
            } },
            x: { title: {
              display: true,
              text: 'Level',
            } },
          },
        }}
        data={{
          labels: levels,
          datasets: Object.entries(resultsByName).map(([simName, sims]) => ({
            data: levels.map((level) => sims.find((s) => s.simParams.level === level)?.stats?.mean),
            label: simName,
          })),
        }}
      />
    </Box>
  );
};

export default SimResultComparison;
