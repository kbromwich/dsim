import React from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import SimConfig from 'sim/SimConfig';
import iterationScale from 'util/iterationScale';
import parseSearchParams from 'util/parseSeachParams';

import SimList from './SimList';
import SimRunner from './SimRunner';
import SimConfiguration from './SimConfiguration';
import { decompressFromUrl } from 'util/compression';

export default function App() {
  const urlParams = parseSearchParams();
  const urlSims = urlParams.sims && decompressFromUrl(urlParams.sims).split('\n');
  const urlAcValues = urlParams.acValues && urlParams.acValues;
  const urlLevels = urlParams.levels && urlParams.levels;
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [allSims, setAllSimsState] = React.useState<string[]>(urlSims || JSON.parse(localStorage.getItem('allSims') || '[]'));
  const [selectedSims, setSelectedSimsState] = React.useState<string[]>(JSON.parse(localStorage.getItem('selectedSims') || '[]'));
  const lsConf: Partial<SimConfig> = JSON.parse(localStorage.getItem('config') || '{}');
  const [config, setConfigState] = React.useState<SimConfig>({
    acValues: urlAcValues || lsConf.acValues || '12,15,18',
    iterations: lsConf.iterations ?? 3,
    levels: urlLevels || lsConf.levels || '1-20',
    workers: navigator.hardwareConcurrency,
  });
  const linkSandboxMode = !!Object.keys(urlParams).length;
  const saveSetting = (key: string, value: string) => !linkSandboxMode && localStorage.setItem(key, value);

  const setAllSims = (sims: string[]) => {
    setAllSimsState(sims);
    saveSetting('allSims', JSON.stringify(sims));
  };
  const setSelectedSims = (simNames: string[]) => {
    setSelectedSimsState(simNames);
    saveSetting('selectedSims', JSON.stringify(simNames));
  };
  const setConfig = (newConfig: SimConfig) => {
    setConfigState(newConfig);
    saveSetting('config', JSON.stringify(newConfig));
  };

  return (
    <Container maxWidth="lg">
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            D&amp;D Damage Simulator
          </Typography>
          {linkSandboxMode && (
            <Typography sx={{ fontStyle: 'italic' }} variant="body2">
              Linked-sandbox mode: changes will not be saved!
            </Typography>
          )}
        </Box>
      </Container>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={(e, tab) => setSelectedTab(tab)}>
          <Tab sx={{ width: '50%', maxWidth: '50%' }} label="Simulation Definitions" />
          <Tab sx={{ width: '50%', maxWidth: '50%'  }} label="Simulation Runner" />
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
        <SimConfiguration config={config} onChange={setConfig} />
        <SimRunner
          rawAcValues={config.acValues}
          iterations={iterationScale(config.iterations)}
          rawLevels={config.levels}
          rawSimDefs={allSims}
          workers={config.workers}
        />
      </div>
    </Container>
  );
}
