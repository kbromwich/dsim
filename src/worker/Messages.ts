import SimParams from 'sim/SimParams';
import Distribution from 'util/Distribution';

export interface ConfigureMessage {
  command: 'configure';
  expression: string;
  config: SimParams;
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
  distribution: Distribution;
}

export type ToWorkerMessages = ConfigureMessage | RunMessage | StopMessage;
