export type Transition<S, E> = (state: S, event: E) => S;

export type SugarTransition<S extends { state: string }, E extends { type: string }> = {
  [K in E['type']]?: (state: S, event: Extract<E, { type: K }>) => S;
} & {
  default?: (state: S, event: E) => S;
};

type BaseEvent = { type: string };

export type FSMDefinition<S extends { state: string }, E extends { type: string }> = {
  initial: S;
  transitions: Record<
    S['state'],
    {
      [K in E['type']]?: (state: S, event: Extract<E, { type: K }>) => S
    } & {
      default?: (state: S, event: E) => S
    }
  >;

  // Lifecycle hooks
  onInit?: (initialState: S) => void;
  onSend?: (event: E, currentState: S) => void;
  onTransition?: (from: S, to: S, event: E) => void;
  onUnhandled?: (event: unknown, currentState: S) => void;
  onDestroy?: (finalState: S) => void;
  onReset?: (initialState: S) => void;
  onSpawn?: (initialState: S) => void;
};

export type FSMInstance<S, E> = {
  state: S;
  send: (event: E) => void;
  subscribe: (listener: (state: S) => void) => () => void;
  reset: () => void;
  destroy: () => void;
};


export interface BuiltFSM<S, E> {
  send(event: E): void;
  send(child: string, event: E): void;
  fetch(name?: string): S | Record<string, S>;
  children: Record<string, FSMInstance<S, E>>;
}

