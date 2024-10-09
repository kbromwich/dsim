import Simulation from './Simulation';

export type LineError = { line: number; message: string };

export interface ParsedSims {
  readonly sims: Record<string, Simulation[]>;
  readonly names: string[];
  readonly errors: LineError[];
}