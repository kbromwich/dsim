import SimResult from 'sim/SimResult';

export default interface ResultHoverTarget {
  simResult: SimResult;
  elementRef: React.RefObject<HTMLElement>;
}
