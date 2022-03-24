import SimConfig from 'sim/SimConfig';
import { Stats } from 'sim/Stats';

export interface ConfigureMessage {
  command: 'configure';
  expression: string;
  config: SimConfig;
}

export interface RunMessage {
  command: 'run';
  iterations: number;
}

export interface StopMessage {
  command: 'stop';
}

export interface CompleteMessage {
  command: 'complete';
  stats: Stats;
}

export type ToWorkerMessages = ConfigureMessage | RunMessage | StopMessage;
