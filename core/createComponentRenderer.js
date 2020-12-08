import arrayEqual from "./arrayEqual";
import createData from "./createData";
import createReadonlyProxy from "./createReadonlyProxy";
import globalContext from "./globalContext";
import { componentType } from "./types";
import { invokeAll } from "./util";

export default function createComponentRenderer(
  mount,
  context,
  marker,
  content
) {
  let { render, props, forceUpdate } = content;
  let inner = createData(marker, "component");
  let currentProps = props;
  let unmounted = false;
  let propsProxy;
  let effects = [];
  let mounted = false;
  let unsubscribe;
  let component = (globalContext.component = {
    get props() {
      if (!propsProxy) propsProxy = createReadonlyProxy(() => currentProps);
      return propsProxy;
    },
    addEffect,
  });
  let reactiveHandler = context.createReactiveHandler((result) => {
    !unmounted && mount(context, inner, result);
    if (!mounted) {
      mounted = true;
      unsubscribe = context.addBinding(runEffects);
      runEffects();
    }
  });

  function runEffects() {
    if (unmounted) return;
    for (let i = 0; i < effects.length; i++) {
      let effectData = effects[i];
      let [effect, deps] = effectData;
      let currentDeps = deps ? deps(component.props, context) : [Symbol()];
      if (!arrayEqual(currentDeps, effectData.prevDeps)) {
        effectData.prevDeps = currentDeps;
        effectData.dispose && effectData.dispose();
        effectData.dispose = effect();
      }
    }
  }

  function addEffect(effect, deps) {
    if (mounted)
      throw new Error("Cannot add effect after the component mounted");
    effects.push([effect, deps]);
  }

  return {
    type: componentType,
    render,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      unsubscribe && unsubscribe();
      invokeAll(effects, undefined, "dispose");
      inner.unmount();
    },
    reorder: inner.reorder,
    update({ ref, props }) {
      currentProps = props;
      (!mounted || forceUpdate) && reactiveHandler(render);
    },
  };
}
