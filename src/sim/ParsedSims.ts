import Simulation from './Simulation';

export type LineError = {
  /* Zero-based line index */
  lineStart: number;
  lineCount?: number;
  message: string;
};

export interface ParsedSims {
  readonly sims: Record<string, Simulation[]>;
  readonly names: string[];
  readonly errors: LineError[];
}