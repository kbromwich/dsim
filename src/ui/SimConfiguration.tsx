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

const SimConfiguration: React.FC<Props> = ({ config, onChange }) => {
  return (
    <Box sx={{ paddingTop: 1, display: 'flex', justifyContent: 'space-around' }}>
      <Box sx={{ flexBasis: '30%' }}>
        <Typography>Iterations</Typography>
        <Slider
          marks={[
            { label: '1', value: 0 },
            { label: '10', value: 1 },
            { label: '100', value: 2 },
            { label: '1K', value: 3 },
            { label: '10K', value: 4 },
            { label: '100K', value: 5 },
            { label: '1M', value: 6 },
          ]}
          max={6}
          min={0}
          scale={iterationScale}
          size="small"
          step={0.1}
          sx={{ flexBasis: '33%' }}
          valueLabelDisplay="on"
          value={config.iterations}
          onChange={(e, value) => onChange({ ...config, iterations: value as number })}
        />
      </Box>
      <TextField
        error={!tryParseRanges(config.levels)}
        label="Levels"
        value={config.levels}
        onChange={(e) => onChange({ ...config, levels: e.target.value })}
      />
      <TextField
        error={!tryParseRanges(config.acValues)}
        label="ACs"
        value={config.acValues}
        onChange={(e) => onChange({ ...config, acValues: e.target.value })}
      />
    </Box>
  );
};

export default SimConfiguration;
