import arrayEqual from "./arrayEqual";
import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";
import createData from "./createData";
import { componentType } from "./types";

export default function createComponentRenderer(
  mount,
  context,
  marker,
  render
) {
  let inner = createData(marker, "component");
  let state = {};
  let asyncHandler = context.asyncHandler;
  let effects = [];
  let mounted = false;
  let component = {
    effect(fn, deps) {
      if (!mounted && !deps) return fn(context);
      effects[effectIndex] = { ...effects[effectIndex], fn, deps };
      effectIndex++;
    },
  };
  let lastPromise;
  let updateToken;
  let effectIndex = 0;

  function update() {
    if (inner.unmounted || updateToken === context.updateToken) return;
    updateToken = context.updateToken;
    let prevComponent = globalContext.component;
    try {
      effectIndex = 0;
      globalContext.component = component;
      let result = render(state, context);
      if (isPromiseLike(result)) {
        let promise = (lastPromise = result);
        promise.then((asyncResult) => {
          if ((!component || !component.unmounted) && lastPromise === promise) {
            mount(context, inner, asyncResult);
            runEffects();
          }
        });
        return;
      }
      lastPromise = null;
      mount(context, inner, result);
      runEffects();
    } catch (e) {
      if (isPromiseLike(e) && asyncHandler) return asyncHandler(e);
      throw e;
    } finally {
      globalContext.component = prevComponent;
    }
  }

  function runEffects() {
    mounted = true;
    if (!effectIndex) return;
    for (let effect of effects) {
      if (arrayEqual(effect.prev, effect.deps)) continue;
      effect.prev = effect.deps;
      effect.dispose && effect.dispose();
      effect.dispose = effect.fn(context);
    }
  }

  context.addBinding(update);

  return {
    type: componentType,
    render,
    unmount() {
      if (inner.unmounted) return;
      inner.unmount();
      for (let effect of effects) {
        effect.dispose && effect.dispose();
      }
    },
    reorder: inner.reorder,
    update(nextRender) {
      nextRender = render;
      update();
    },
  };
}
