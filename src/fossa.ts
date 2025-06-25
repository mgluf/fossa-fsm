import type { FSMDefinition, FSMInstance, BuiltFSM } from './types';
import { createFSM } from './fsm';

// Internal registry
let rootFSM: FSMInstance<any, any> | null = null;
const children: Record<string, FSMInstance<any, any>> = {};

export function fossa() {
  let definition: FSMDefinition<any, any> | null = null;

  return {
    root<S extends { state: string }, E extends { type: string }>(def: FSMDefinition<S, E>) {
      if (rootFSM) throw new Error('Root FSM already exists');
      rootFSM = createFSM(def);
      definition = def;
      def.onInit?.(def.initial);
      return this;
    },

    child<S extends { state: string }, E extends { type: string }>(name: string, def: FSMDefinition<S, E>) {
      if (!rootFSM) throw new Error('Define root FSM first');
      if (children[name]) throw new Error(`Child FSM '${name}' already exists`);
      const fsm = createFSM(def);
      children[name] = fsm;
      def.onInit?.(def.initial);
      return this;
    },

    build(): BuiltFSM<any, any> {
      if (!rootFSM) throw new Error('Cannot build without a root FSM');
      return {
        send(arg1: any, arg2?: any): void {
          if (arg2 === undefined) {
            if (!rootFSM) throw new Error('Root FSM not defined');
            rootFSM.send(arg1);
          } else {
            const target = children[arg1];
            if (!target) throw new Error(`No child FSM named '${arg1}'`);
            target.send(arg2);
          }
        },
        get children() {
          return { ...children };
        },
        fetch(name?: string) {
          if (!name) return {
            root: rootFSM!.state,
            ...Object.fromEntries(Object.entries(children).map(([k, v]) => [k, v.state]))
          };
          if (name === 'root') return rootFSM!.state;
          if (!children[name]) throw new Error(`No FSM named '${name}'`);
          return children[name].state;
        }
      };
    }
  };
}