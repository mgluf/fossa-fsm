import type { FSMDefinition, FSMInstance } from "./types";

export function createFSM<S extends { state: string }, E extends { type: string }>(
  def: FSMDefinition<S, E>
): FSMInstance<S, E> {
  let state = def.initial;
  const listeners = new Set<(s: S) => void>();

  const notify = () => listeners.forEach(fn => fn(state));

  return {
    get state() {
      return state;
    },
    send(event) {
      def.onSend?.(event, state);

      const currentKey = state.state as keyof typeof def.transitions;
      const stateHandlers = def.transitions[currentKey];

      if (!stateHandlers) {
        def.onUnhandled?.(event, state);
        return;
      }

      const handler = stateHandlers[event.type as keyof typeof stateHandlers] ?? stateHandlers.default;

      if (!handler) {
        def.onUnhandled?.(event, state);
        return;
      }

      const next = (handler as (state: S, event: E) => S)(state, event);
      def.onTransition?.(state, next, event);

      state = next;
      notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    }
  };
}

