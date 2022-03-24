import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import SimList from './SimList';
import SimRunner from './SimRunner';

export default function App() {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [allSims, setAllSimsState] = React.useState(JSON.parse(localStorage.getItem('allSims') || '[]'));
  const [selectedSims, setSelectedSimsState] = React.useState(JSON.parse(localStorage.getItem('selectedSims') || '[]'));
  const setAllSims = (sims: string[]) => {
    setAllSimsState(sims);
    localStorage.setItem('allSims', JSON.stringify(sims));
  };
  const setSelectedSims = (simNames: string[]) => {
    setSelectedSimsState(simNames);
    localStorage.setItem('selectedSims', JSON.stringify(simNames));
  };
  return (
    <Container maxWidth="lg">
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            D&amp;D Damage Simulator
          </Typography>
        </Box>
      </Container>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={(e, tab) => setSelectedTab(tab)}>
          <Tab sx={{ width: '50%', maxWidth: '50%' }} label="Simulation Definitions" />
          <Tab sx={{ width: '50%', maxWidth: '50%'  }} label="Run Simulations" />
        </Tabs>
      </Box>
      <div hidden={selectedTab !== 0}>
        <SimList
          sims={allSims}
          selected={selectedSims}
          setSims={setAllSims}
          setSelected={setSelectedSims}
        />
      </div>
      <div hidden={selectedTab !== 1}>
        {/* <SimRunner sims={selectedSims} /> */}
        <SimRunner
          rawSimDefs={allSims}
          iterations={1000000}
          acValues={[14, 16, 18]}
        />
      </div>
    </Container>
  );
}
