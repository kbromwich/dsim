import React from 'react';
import SimRun from './SimRun';

export interface RunnerState {
  status: 'running' | 'errored' | 'completed' | 'init' | 'canceled';
  onStop?: () => void;
  time: number;
  results: SimRun[];
  errors: string[];
  iterations: number;
  acValues: number[];
  rawAcValues: string;
  rawLevels: string;
  compressedSimDefs: string
}

export type RunnerStateSet = [RunnerState, (newState: Partial<RunnerState>) => void];

export const useRunnerState = (sims: string): RunnerStateSet => {
  const [state, setState] = React.useState<RunnerState>({
    status: 'init',
    onStop: undefined,
    time: 0,
    results: [],
    errors: [],
    iterations: 0,
    acValues: [],
    rawAcValues: '',
    rawLevels: '',
    compressedSimDefs: '',
  });
  return [state, (newState: Partial<RunnerState>) => {
    setState((curState) => ({ ...curState, ...newState }));
  }];
};
