export default function createEmitter() {
  let listeners = [];
  let emitting = 0;
  let removed;
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
        removed.push(index);
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
      if (!removed) removed = [];
      let copy = listeners;
      for (let i = 0; i < copy.length; i++) copy[i](payload);
    } finally {
      emitting--;
      if (!emitting) {
        if (removed.length) {
          removed.sort();
          while (removed.length) listeners.splice(removed.pop(), 1);
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
