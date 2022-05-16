import React from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SimConfig from 'sim/SimConfig';
import iterationScale from 'util/iterationScale';
import { tryParseRanges } from 'util/parseRanges';
import DynamicAC, { DynamicACData } from 'sim/DynamicAC';

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
  const { levels, iterations, workers, acValues, dynamicAc, saveModOffset } = config;
  const acError = !(dynamicAc || acValues) || !!(acValues && !tryParseRanges(acValues));
  return (
    <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2, }}>
      <TextField
        error={!tryParseRanges(levels)}
        label="Levels"
        value={levels}
        onChange={(e) => onChange({ ...config, levels: e.target.value })}
        title="Levels to simulate. Comma separated, and can be ranges; e.g. &quot;1,2,3-5,8-10&quot;"
      />
      <TextField
        error={acError}
        label="Armor Classes"
        value={acValues}
        onChange={(e) => onChange({ ...config, acValues: e.target.value })}
        title="ACs to simulate. Comma separated, and can be ranges; e.g. &quot;10,12-15,18,20&quot;"
      />
      <FormControlLabel
        label="Add Leveled AC: 65% Hit Chance"
        control={
          <Checkbox
            checked={dynamicAc === DynamicAC.SBCTH65}
            onChange={(_, checked) => {
              if (dynamicAc.includes(DynamicAC.SBCTH65)) {
                onChange({ ...config, dynamicAc: '' });
              } else {
                onChange({ ...config, dynamicAc: DynamicAC.SBCTH65 });
              }
            }}
          />
        }
        title={DynamicACData[DynamicAC.SBCTH65].description}
      />
      <TextField
        error={!tryParseRanges(levels)}
        label="Save Modifier AC Offset"
        value={saveModOffset}
        onChange={(e) => onChange({ ...config, saveModOffset: e.target.value })}
        title={`Save modifier (SM) will be:
  SM = AC - x
Where "x" is the offset specified here. Smaller values will make saves more
likely to succeed.

Setting this to a value of 14 will result in a 65% chance for saves to fail in a
"standard build" when in combination with "Leveled AC: 65% Hit Chance".`}
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
