import React from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

interface Props {
  sims: string[];
  setSims: (sims: string[]) => void;
  selected: string[];
  setSelected: (sims: string[]) => void;
}

const SimList: React.FC<Props> = ({ sims, selected, setSims }) => {
  return (
    <Box sx={{ flexBasis: '33%', padding: 1 }}>
      <TextField
        fullWidth
        multiline
        minRows={3}
        value={sims.join('\n')}
        onChange={(e) => setSims(e.target.value.split('\n'))}
      />
    </Box>
  );
};

export default SimList;
