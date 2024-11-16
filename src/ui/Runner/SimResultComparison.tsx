import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
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
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
);

// Colors from https://sashamaps.net/docs/resources/20-colors/
const COLORS = [
  '#e6194B', // red
  '#3cb44b', // green
  '#ffe119', // yellow
  '#4363d8', // blue
  '#f58231', // orange
  '#911eb4', // purple
  '#42d4f4', // cyan
  '#f032e6', // magenta
  '#bfef45', // lime
  '#fabed4', // pink
  '#469990', // teal
  '#dcbeff', // lavender
  '#9A6324', // brown
  '#fffac8', // beige
  '#800000', // maroon
  '#aaffc3', // mint
  '#808000', // olive
  '#ffd8b1', // apricot
  '#000075', // navy
  '#a9a9a9', // grey
  '#000000', // black
];

interface Props {
  simResults: SimRun[];
  title: string;
}
const SimResultComparison: React.FC<Props> = ({ simResults, title }) => {
  const levels = arrayUnique(simResults.map((sim) => sim.simParams.level)).sort((a, b) => a - b);
  const resultsByName = arrayBinned(simResults, (r) => r.simulation.name)
  return (
    <Box sx={{ p: 2 }}>
      <Line
        data={{
          labels: levels,
          datasets: Object.entries(resultsByName).map(([simName, sims], i) => ({
            data: levels.map((level) => sims.find((s) => s.simParams.level === level)?.stats?.mean),
            label: simName,
            backgroundColor: COLORS[i % COLORS.length],
            borderColor: COLORS[i % COLORS.length],
          })),
        }}
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
        width={600}
        height={500}
      />
    </Box>
  );
};

export default SimResultComparison;
