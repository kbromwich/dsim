import React from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import SimConfig from 'sim/SimConfig';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import iterationScale from 'util/iterationScale';
import { tryParseRanges } from 'util/parseRanges';

interface Props {
  config: SimConfig;
  onChange: (config: SimConfig) => void;
}

const iterLabels = [
  'Approx',
  'Low',
  'Medium',
  'High',
];

const SimConfiguration: React.FC<Props> = ({ config, onChange }) => {
  const { levels, iterations, workers, acValues } = config;
  return (
    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1, }}>
      <TextField
        error={!tryParseRanges(levels)}
        label="Levels"
        value={levels}
        onChange={(e) => onChange({ ...config, levels: e.target.value })}
        title="Levels to simulate. Comma separated, and can be ranges; e.g. &quot;1,2,3-5,8-10&quot;"
      />
      <TextField
        error={!tryParseRanges(acValues)}
        label="Armor Classes"
        value={acValues}
        onChange={(e) => onChange({ ...config, acValues: e.target.value })}
        title="ACs to simulate. Comma separated, and can be ranges; e.g. &quot;10,12-15,18,20&quot;"
      />
      <Box sx={{ px: 1 }}>
        <Typography title="Number of iterations to perform for each simulation">
          Accuracy: {iterLabels[iterations - 3]}
        </Typography>
        <Slider
          max={6}
          min={3}
          scale={iterationScale}
          size="small"
          step={1}
          valueLabelDisplay="auto"
          value={iterations}
          onChange={(e, value) => onChange({ ...config, iterations: value as number })}
          title="Number of iterations to perform for each simulation"
        />
      </Box>
      <Box sx={{ px: 1 }}>
        <Typography title="Number of worker threads to run simulations in parallel with">
          Workers: {workers === navigator.hardwareConcurrency ? 'Max' : workers}
        </Typography>
        <Slider
          max={navigator.hardwareConcurrency}
          min={1}
          size="small"
          step={1}
          valueLabelDisplay="auto"
          value={workers}
          onChange={(e, value) => onChange({ ...config, workers: value as number })}
          title="Number of worker threads to run simulations in parallel with"
        />
      </Box>
    </Box>
  );
};

export default SimConfiguration;
