import SimConfig from 'sim/SimConfig';
import { Stats } from 'util/calculateStats';
import WorkerCommand from './WorkerCommand';

export interface ConfigureMessage {
  command: WorkerCommand.Configure;
  expression: string;
  config: SimConfig;
}

export interface RunMessage {
  command: WorkerCommand.Run;
  iterations: number;
}

export interface CompleteMessage {
  command: WorkerCommand.Complete;
  stats: Stats;
}

export type ToWorkerMessages = ConfigureMessage | RunMessage;
