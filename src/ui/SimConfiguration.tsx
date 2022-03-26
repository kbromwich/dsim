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
            { label: 'Very Fast', value: 3 },
            { label: 'Fast', value: 4 },
            { label: 'Balanced', value: 5 },
            { label: 'Accurate', value: 6 },
          ]}
          max={6}
          min={3}
          scale={iterationScale}
          size="small"
          step={1}
          sx={{ flexBasis: '33%' }}
          valueLabelDisplay="auto"
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
