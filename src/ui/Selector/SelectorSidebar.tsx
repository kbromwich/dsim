import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface Props {
  selected: Set<string>;
}

const SelectorSidebar: React.FC<Props> = ({ selected }) => {
  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Typography sx={{ py: 2 }}>Selected: {selected.size}</Typography>
    </Box>
  );
};

export default SelectorSidebar;
