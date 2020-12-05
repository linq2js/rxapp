import { noop } from "./util";

export default function createEmitter() {
  let all = new Map();

  function get(event) {
    let emitter = all.get(event);
    if (emitter) return emitter;

    let listeners = [];
    let mutatingListeners;
    let notifying = 0;
    let lastPayload;
    let sealed = false;

    function on(listener) {
      if (sealed) {
        listener(lastPayload);
        return noop;
      }
      let isActive = true;

      let mutableListeners = getMutableListeners();
      mutableListeners[mutableListeners.length] = listener;

      return () => {
        if (!isActive) return;
        isActive = false;
        let l = getMutableListeners();
        const index = l.indexOf(listener);
        index !== -1 && l.splice(index, 1);
      };
    }

    function getMutableListeners() {
      if (!notifying) return listeners;
      if (mutatingListeners) return mutatingListeners;
      mutatingListeners = listeners.slice(0);
      return mutatingListeners;
    }

    function length() {
      return (mutatingListeners || listeners).length;
    }

    function notify(payload) {
      const length = listeners.length;
      if (!length) return;
      try {
        notifying++;

        if (typeof payload === "function") {
          for (let i = 0; i < length; i++) {
            payload(listeners[i]);
          }
        } else {
          for (let i = 0; i < length; i++) {
            listeners[i](payload);
          }
        }
      } finally {
        notifying--;
        if (!notifying) {
          if (mutatingListeners) {
            listeners = mutatingListeners;
            mutatingListeners = undefined;
          }
        }
      }
    }

    function emit(payload) {
      !sealed && notify(payload);
    }

    function clear() {
      getMutableListeners().length = 0;
    }

    function once(listener) {
      const remove = on(function () {
        remove();
        return listener.apply(this, arguments);
      });
      return remove;
    }

    function emitOnce(payload) {
      if (sealed) return;
      sealed = true;
      lastPayload = payload;
      notify(payload);
      clear();
    }

    emitter = {
      on,
      emit,
      emitOnce,
      clear,
      once,
      length,
      listeners,
    };
    all.set(event, emitter);
    return emitter;
  }

  function on(event, listener = noop) {
    return get(event).on(listener);
  }

  function emit(event, payload) {
    return get(event).emit(payload);
  }

  function emitOnce(event, payload) {
    return get(event).emitOnce(payload);
  }

  function once(event, listener = noop) {
    return get(event).once(listener);
  }

  function has(event) {
    let emitter = all.get(event);
    return emitter && emitter.length();
  }

  return {
    on,
    once,
    emit,
    emitOnce,
    get,
    has,
    clear(event) {
      if (event) {
        // clear specified event listeners
        get(event).clear();
        delete all[event];
      } else {
        // clear all event listeners
        all = {};
      }
    },
  };
}
