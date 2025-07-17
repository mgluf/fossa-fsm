import type { FSMDefinition, FSMInstance, BuiltFSM } from './types';
import { createFSM } from './fsm';

let rootFSM: FSMInstance<any, any> | null = null;
const children: Record<string, FSMInstance<any, any>> = {};
const childDefs: Record<string, FSMDefinition<any, any>> = {};
let rootDef: FSMDefinition<any, any> | null = null;

export function fossa() {
  return {
    root<S extends { state: string }, E extends { type: string }>(def: FSMDefinition<S, E>) {
      if (rootFSM) throw new Error('Root FSM already exists');
      rootFSM = createFSM(def);
      rootDef = def;
      def.onInit?.(def.initial);
      return this;
    },

    child<S extends { state: string }, E extends { type: string }>(name: string, def: FSMDefinition<S, E>) {
      if (!rootFSM) throw new Error('Define root FSM first');
      if (children[name]) throw new Error(`Child FSM '${name}' already exists`);
      const fsm = createFSM(def);
      children[name] = fsm;
      childDefs[name] = def;
      def.onInit?.(def.initial);
      return this;
    },

    spawn<S extends { state: string }, E extends { type: string }>(name: string, def: FSMDefinition<S, E>) {
      if (children[name]) throw new Error(`FSM '${name}' already exists`);
      const fsm = createFSM(def);
      children[name] = fsm;
      childDefs[name] = def;
      def.onSpawn?.(def.initial);
      return fsm;
    },

    reset(name?: string) {
      if (!name) {
        rootFSM?.reset();
        Object.values(children).forEach(fsm => fsm.reset());
      } else if (name === 'root') {
        rootFSM?.reset();
      } else {
        children[name]?.reset();
      }
    },

    delete(name?: string) {
      if (!name || name === 'root') {
        rootFSM?.destroy();
        rootFSM = null;
        rootDef = null;
        Object.values(children).forEach(fsm => fsm.destroy());
        for (const key in children) delete children[key];
        for (const key in childDefs) delete childDefs[key];
      } else {
        children[name]?.destroy();
        delete children[name];
        delete childDefs[name];
      }
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
