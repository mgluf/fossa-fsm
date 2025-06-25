export type Transition<S, E> = (state: S, event: E) => S;

export type FSMDefinition<S, E> = {
  initial: S;
  transitions: Record<string, Transition<S, E>>;
};

export type FSMInstance<S, E> = {
  state: S;
  send: (event: E) => void;
  subscribe: (listener: (state: S) => void) => () => void;
};
