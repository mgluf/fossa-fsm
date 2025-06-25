import type { FSMDefinition } from './types';

export function update<S extends { state: string }, E extends { type: string }>(
  def: FSMDefinition<S, E>,
  current: S,
  event: E
): S {
  const stateKey = current.state as keyof typeof def.transitions;
  const stateHandlers = def.transitions[stateKey];

  if (!stateHandlers) {
    def.onUnhandled?.(event, current);
    return current;
  }

  const handler =
    (stateHandlers[event.type as keyof typeof stateHandlers] as ((s: S, e: E) => S) | undefined)
    ?? (stateHandlers as { default?: (s: S, e: E) => S }).default;

  if (!handler) {
    def.onUnhandled?.(event, current);
    return current;
  }

  const next = handler(current, event);
  def.onTransition?.(current, next, event);
  return next;
}
