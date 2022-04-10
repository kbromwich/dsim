import React from 'react';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import SimConfig from 'sim/SimConfig';
import { DefaultRawSims } from 'sim/examples';
import parseSearchParams from 'util/parseSeachParams';
import { decompressFromUrl } from 'util/compression';

import { useEditorState } from './Editor/EditorState';
import EditorSidebar from './Editor/EditorSidebar';
import Editor from './Editor/Editor';
import { useSelectorState } from './Selector/SelectorState';
import ListSidebar from './Selector/SelectorSidebar';
import Selector from './Selector/Selector';
import { useRunnerState } from './Runner/RunnerState';
import RunnerSidebar from './Runner/RunnerSidebar';
import Runner from './Runner/Runner';
import Readme from './Readme';


const SideBar = styled('div')(({ theme }) => ({
  width: 200,
  textAlign: 'center',
  backgroundColor: theme.palette.divider,
}));

export default function App() {
  const urlParams = parseSearchParams();

  const urlSims = urlParams.sims && decompressFromUrl(urlParams.sims);
  const [allSims, setAllSimsState] = React.useState(urlSims ?? localStorage.getItem('sims') ?? DefaultRawSims);
  const [selectedSims, setSelectedSimsState] = React.useState(new Set(localStorage.getItem('selectedSims')?.split('\n') || []));

  const urlAcValues = urlParams.acValues && urlParams.acValues;
  const urlLevels = urlParams.levels && urlParams.levels;
  const lsConf: Partial<SimConfig> = JSON.parse(localStorage.getItem('config') || '{}');
  const [config, setConfigState] = React.useState<SimConfig>({
    acValues: urlAcValues || lsConf.acValues || '12,15,18',
    iterations: lsConf.iterations ?? 3,
    levels: urlLevels || lsConf.levels || '1-20',
    workers: lsConf.workers || Math.ceil(navigator.hardwareConcurrency / 2),
  });
  
  const sandboxMode = !!Object.keys(urlParams).length;
  const saveSetting = (key: string, value: string) => !sandboxMode && localStorage.setItem(key, value);
  const [tab, setTabState] = React.useState(sandboxMode ? 3 : Number(localStorage.getItem('tab') ?? 0));

  const setAllSims = (sims: string) => {
    setAllSimsState(sims);
    console.log('saving sims', sandboxMode, sims);
    saveSetting('sims', sims);
  };
  const setSelectedSims = (simNames: Set<string>) => {
    setSelectedSimsState(simNames);
    saveSetting('selectedSims', [...simNames].join('\n'));
  };
  const setConfig = (newConfig: SimConfig) => {
    setConfigState(newConfig);
    saveSetting('config', JSON.stringify(newConfig));
  };
  const setTab = (tab: number) => {
    setTabState(tab);
    saveSetting('tab', String(tab));
  };

  const editorStateSet = useEditorState(sandboxMode);
  const editsInProgress = editorStateSet[0].editSims !== undefined;
  const selectorStateSet = useSelectorState(allSims);
  const runnerStateSet = useRunnerState(allSims);

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <SideBar>
        <Box sx={{ my: 4 }}>
          <Typography
            component="h2"
            fontFamily="serif"
            fontWeight="bold"
            gutterBottom
            variant="h5"
          >
            D&amp;D Damage Simulator
          </Typography>
          {sandboxMode && (
            <Typography sx={{ fontStyle: 'italic' }} variant="body2">
              Linked-sandbox mode: changes will not be saved!
            </Typography>
          )}
        </Box>
        <Box>
          <Tabs value={tab} onChange={(e, tab) => setTab(tab)} orientation="vertical">
            <Tab label="About" />
            <Tab label={editsInProgress ? 'Edit Sims*' : 'Edit Sims'} />
            <Tab label="Select Sims" />
            <Tab label="Run Sims" />
          </Tabs>
        </Box>

        {tab === 1 && (
          <EditorSidebar
            onSimsChange={setAllSims}
            sandboxMode={sandboxMode}
            editStateSet={editorStateSet}
          />
        )}
        {tab === 2 && (
          <ListSidebar
            selected={selectedSims}
            onSelectedChange={setSelectedSims}
            selectStateSet={selectorStateSet}
          />
        )}
        {tab === 3 && (
          <RunnerSidebar
            rawSims={allSims}
            selected={selectedSims}
            config={config}
            onConfigChange={setConfig}
            runStateSet={runnerStateSet}
          />
        )}
      </SideBar>
      <Box sx={{ height: "100vh", width: '100%' }}>
        {tab === 0 && <Readme />}
        {tab === 1 && (
          <Editor
            sims={allSims}
            editStateSet={editorStateSet}
          />
        )}
        {tab === 2 && (
          <Selector
            selected={selectedSims}
            onSelectedChange={setSelectedSims}
            selectStateSet={selectorStateSet}
          />
        )}
        {tab === 3 && (
          <Runner
            config={config}
            rawSims={allSims}
            selected={selectedSims}
            runStateSet={runnerStateSet}
          />
        )}
      </Box>
    </Box>
  );
}
