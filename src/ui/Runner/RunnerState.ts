import React from 'react';
import DynamicAC from 'sim/DynamicAC';
import SimRun from './SimRun';

export interface RunnerState {
  status: 'running' | 'errored' | 'completed' | 'init' | 'canceled';
  onStop?: () => void;
  time: number;
  results: SimRun[];
  iterations: number;
  acValues: number[];
  dacValues: DynamicAC[];
  rawAcValues: string;
  rawDacValues: string;
  rawSaveModOffset: string;
  rawLevels: string;
  compressedSimDefs: string;
}

export type RunnerStateSet = [RunnerState, (newState: Partial<RunnerState>) => void];

export const useRunnerState = (): RunnerStateSet => {
  const [state, setState] = React.useState<RunnerState>({
    status: 'init',
    onStop: undefined,
    time: 0,
    results: [],
    iterations: 0,
    acValues: [],
    dacValues: [],
    rawAcValues: '',
    rawDacValues: '',
    rawSaveModOffset: '',
    rawLevels: '',
    compressedSimDefs: '',
  });
  return [state, (newState: Partial<RunnerState>) => {
    setState((curState) => ({ ...curState, ...newState }));
  }];
};
