import React from 'react';

type Observer = () => void;

const callCallable = (callable: () => void) => callable();

export interface SharedState<T> {
  state: T;
  observers: Set<Observer>;
}

export function useHeldSharedState<T>(initialState: T): SharedState<T>;
export function useHeldSharedState<T = undefined>(): SharedState<T|undefined>;
export function useHeldSharedState<T>(initialState?: T) {
  return React.useRef<SharedState<T | undefined>>({
    state: initialState,
    observers: new Set(),
  }).current;
};

export const useSetSharedState = <T>(sharedState: SharedState<T>): (
  React.Dispatch<React.SetStateAction<T>>
) => (value) => {
  let newState: T;
  if (typeof value === 'function') {
    newState = (value as (prevState: T) => T)(sharedState.state);
  } else {
    newState = value;
  }
  sharedState.state = newState;
  sharedState.observers.forEach(callCallable);
};

export const useObserveSharedState = <T>(sharedState: SharedState<T>): T => {
  const [, setCount] = React.useState(0);
  React.useEffect(() => {
    const observer = () => setCount((c) => c + 1);
    sharedState.observers.add(observer);
    return () => void sharedState.observers.delete(observer);
  }, [sharedState.observers, setCount]);
  return sharedState.state;
};

export const useSharedState = <T>(sharedState: SharedState<T>): [
  T, React.Dispatch<React.SetStateAction<T>>
] => [useObserveSharedState(sharedState), useSetSharedState(sharedState)];
