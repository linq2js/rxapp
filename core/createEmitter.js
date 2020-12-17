export default function createEmitter() {
  let listeners = [];
  let emitting = 0;
  let removed = 0;
  let cleanup = false;

  function on(listener) {
    let active = true;
    let wrapper = (payload) => active && listener(payload);
    listeners.push(listener);
    return () => {
      if (!active) return;
      active = false;
      let index = listeners.indexOf(wrapper);
      if (emitting) {
        removed++;
        wrapper.removed = true;
      } else {
        listeners.splice(index, 1);
      }
    };
  }

  function length() {
    return listeners.length;
  }

  function emit(payload) {
    try {
      emitting++;
      removed = 0;
      listeners.some((listener) => {
        listener(payload);
      });
      // for (let i = 0; i < copy.length; i++) copy[i](payload);
    } finally {
      emitting--;
      if (!emitting) {
        if (removed) {
          let temp = [];
          listeners.some((listener) => {
            if (!listener.removed) return;
            removed--;
            temp[temp.length] = listener;
            if (!removed) return true;
          });
          listeners = temp;
        }
        removed = null;
        cleanup && clear();
      }
    }
  }

  function clear() {
    if (!listeners.length) return;
    if (emitting) {
      cleanup = true;
    } else {
      listeners = [];
    }
  }

  return { on, length, emit, clear };
}
