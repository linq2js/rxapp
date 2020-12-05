import createEmitter from "./createEmitter";
import getPromiseLoadable from "./getPromiseLoadable";
import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";
import { loadedType, loadingType, storeType } from "./types";
import { enqueue } from "./executionQueue";
import { assign, emptyObject, noop, unset } from "./util";

export default function createStore(initial, options = emptyObject) {
  if (initial && initial[storeType]) return initial;
  let emitters = createEmitter();
  let changeEmitter = emitters.get("#change");
  let loadables = new Map();
  let asyncProxy;
  let api = {
    state: new Map(Object.entries(initial || emptyObject)),
    subscribe() {
      if (arguments.length > 1) return emitters.on(arguments[0], arguments[1]);
      return changeEmitter.on(arguments[0]);
    },
    select(selector) {
      let prevHandleStoreUpdate = globalContext.handleStoreUpdate;
      if (!prevHandleStoreUpdate) return selector(stateProxy);
      let prevValue;
      let listener;

      try {
        globalContext.handleStoreUpdate = noop;
        prevValue = selector(stateProxy);
        let unsubscribe = changeEmitter.on(() => {
          let currentValue = selector(stateProxy);
          if (currentValue === prevValue) return;
          prevValue = currentValue;
          enqueue([listener]);
        });
        prevHandleStoreUpdate((x) => {
          listener = x;
          return unsubscribe;
        });
        return prevValue;
      } finally {
        globalContext.handleStoreUpdate = prevHandleStoreUpdate;
      }
    },
  };

  function createAsyncProxy() {
    return new Proxy(
      {},
      {
        get(target, p, receiver) {
          let loadable = loadables.get(p);
          if (loadable === unset) loadable = createLoadable(api.state.get(p));
          return loadable;
        },
      }
    );
  }

  let stateProxy = new Proxy(emptyObject, {
    get(target, p) {
      switch (p) {
        case storeType:
          return api;
        case "$subscribe":
          return api.subscribe;
        case "$select":
          return api.select;
        case "$async":
          if (!asyncProxy) asyncProxy = createAsyncProxy();
          return asyncProxy;
        default:
      }
      if (globalContext.handleStoreUpdate) {
        globalContext.handleStoreUpdate((listener) =>
          api.subscribe(p, listener)
        );
      }
      return api.state.get(p);
    },
    set(target, p, value, receiver) {
      let prevValue = api.state.get(p);
      if (prevValue === value) return true;
      api.state.set(p, value);
      loadables.set(p, unset);
      enqueue(emitters.get(p).listeners);
      changeEmitter.emit({ key: p, value });
      return true;
    },
    ownKeys() {
      return api.state.keys();
    },
    getOwnPropertyDescriptor(target, key) {
      return {
        value: api.state.get(key),
        enumerable: true,
        configurable: true,
      };
    },
  });

  return stateProxy;
}

function createLoadable(value) {
  if (!isPromiseLike(value)) return { status: loadedType, value };
  let promiseLoadable = getPromiseLoadable(value);
  if (promiseLoadable.status !== loadingType) return promiseLoadable;
  let loadableStore = createStore({ status: loadingType });
  value.finally(() => assign(loadableStore, promiseLoadable));
  return {
    get value() {
      if (promiseLoadable.status === loadingType) throw value;
      return loadableStore.value;
    },
    get error() {
      return loadableStore.error;
    },
    get status() {
      return loadableStore.status;
    },
  };
}
