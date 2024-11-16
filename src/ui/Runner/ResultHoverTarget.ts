import SimRun from './SimRun';

export interface ResultDetailsHoverTarget {
  simResult: SimRun;
  element: HTMLElement;
}

export interface ResultComparisonHoverTarget {
  simResults: SimRun[];
  element: HTMLElement;
  title: string;
}

export type ResultHoverTarget = ResultDetailsHoverTarget | ResultComparisonHoverTarget;
