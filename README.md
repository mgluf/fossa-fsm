# `fossa-fsm` v0.1.3
Declarative, Structured Finite State Machines for Modern Apps

<img width="400" height="266.5" alt="image" src="https://github.com/user-attachments/assets/7cf87590-2fb1-466d-be2f-5b57f4642ebc" />

## Why `fossa-fsm`?

`fossa-fsm` is a compact, expressive FSM library built around **explicit architecture**, **predictable transitions**, and **real-world ergonomics**.

## Core Concepts

### One Root FSM

All FSMs descend from a single, required root.

```ts
const app = fossa()
  .root({ ... })              // required
  .child('game', { ... })     // optional
  .child('settings', { ... })
  .build();
```

### Named Children

Each child FSM is scoped by name. Events are routed directly:

```ts
app.send({ type: 'boot' });                 // → root
app.send('game', { type: 'clicked_card' }); // → child
```

## Defining FSMs (Sugar Syntax)

FSMs are defined using a sugar object syntax:

```ts
const fsmDef = {
  initial: { state: 'idle' },
  transitions: {
    idle: {
      start: (s, e) => ({ state: 'running' }),
      default: (s, e) => s
    },
    running: {
      stop: () => ({ state: 'idle' })
    }
  }
};
```

Each state has an object of handlers keyed by `event.type`.

**Handlers:**

```ts
(event) => newState
(state, event) => newState
```

## Setup API

### `fossa()`

Starts a new builder.

### `.root(def)`

Creates the required root FSM.

### `.child(name, def)`

Adds a named child FSM during setup.

### `.build()`

Finalizes and returns your FSM app instance.

## FSMInstance API

After `.build()`, you get:

```ts
{
  send(...): void
  fetch(name?): any
  children: Record<string, FSMInstance>
  spawn(name, def): FSMInstance
  reset(name?): void
  delete(name?): void
}
```

### `.send(...)`

```ts
send(event)              // → root FSM
send('child', event)     // → named child
```

### `.fetch(name?)`

```ts
fetch()                 // all state
fetch('root')           // just root
fetch('game')           // just one child
```

### `.children`

```ts
Object of all named child FSMs
```

### `.spawn(name, def)`

Dynamically adds a child FSM at runtime.

### `.reset(name?)`

Resets the state of one or all FSMs to their initial definition.

### `.delete(name?)`

Removes one or all FSMs from the system, calling any cleanup logic.

## Lifecycle Hooks

FSMs support optional lifecycle hooks:

```ts
{
  onInit(state)
  onSpawn(state)
  onSend(event, state)
  onTransition(from, to, event)
  onUnhandled(event, state)
  onReset(state)
  onDestroy(state)
}
```
These run at various points during FSM lifecycle and transitions.

> ℹ️ **Note** <br/>
>`onInit()` is run during `.build()`, while `onSpawn()` is run after a dynamic FSM is
> created via `.spawn()`

## Pure FSM Updates

```ts
import { update } from 'fossa-fsm';

const nextState = update(def, currentState, event);
```

Same logic as `.send(...)`, but stateless. Useful for:

* SSR
* Replay
* Previews
* Undo systems

## Types

```ts
type FSMDefinition<S, E> = {
  initial: S;
  transitions: Record<
    S['state'],
    {
      [K in E['type']]?: (state: S, event: Extract<E, { type: K }>) => S;
    } & {
      default?: (state: S, event: E) => S;
    }
  >;

  onInit?: (state: S) => void;
  onSpawn?: (state: S) => void;
  onSend?: (event: E, state: S) => void;
  onTransition?: (from: S, to: S, event: E) => void;
  onUnhandled?: (event: unknown, state: S) => void;
  onReset?: (state: S) => void;
  onDestroy?: (state: S) => void;
};
```

## Example: App + Game + Settings

```ts
const app = fossa()
  .root({
    initial: { state: 'booting' },
    transitions: {
      booting: {
        loaded: () => ({ state: 'main_menu' })
      }
    }
  })
  .child('game', {
    initial: { state: 'awaiting' },
    transitions: {
      awaiting: {
        click_card: (s, e) => ({ state: 'resolving', selected: e.card }),
        default: s => s
      },
      resolving: {
        complete: () => ({ state: 'awaiting' })
      }
    }
  })
  .child('settings', {
    initial: { view: 'collapsed' },
    transitions: {
      collapsed: {
        open: () => ({ view: 'expanded' })
      },
      expanded: {
        close: () => ({ view: 'collapsed' })
      }
    }
  })
  .build();
```

```ts
app.send({ type: 'loaded' });                  // → root
app.send('game', { type: 'click_card', card }); // → game
app.send('settings', { type: 'open' });         // → settings
```

## Philosophy

* One root to rule them all — all FSMs are traceable and orchestrated.
* No magic bubbling — FSMs don’t implicitly forward or cascade.
* Easy to test & reason about — pure, declarative logic.
* Light enough to scale from menus to full games.

## Future Plans

* `fossa.devtools()` — trace event/state history
* `fossa.forward(...)` — wire cross-FSM events
* `fossa.guard(...)` — precondition checks
* `fossa.context(...)` — shared global readonly state
* Reactive bindings for frameworks (Svelte, React)
