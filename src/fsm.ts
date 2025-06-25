
import type { FSMDefinition, FSMInstance } from './types';

export function fossa<S, E>(def: FSMDefinition<S, E>): FSMInstance<S, E> {
  let currentState = def.initial;
  const listeners = new Set<(state: S) => void>();

  function notify() {
    listeners.forEach((l) => l(currentState));
  }

  return {
    get state() {
      return currentState;
    },
    send(event) {
      const type = (event as any).type;
      const transition = def.transitions[type];
      if (!transition) throw new Error(`Unknown transition: ${type}`);
      currentState = transition(currentState, event);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(currentState);
      return () => listeners.delete(listener);
    }
  };
}