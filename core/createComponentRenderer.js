import arrayEqual from "./arrayEqual";
import createData from "./createData";
import createReadonlyProxy from "./createReadonlyProxy";
import globalContext from "./globalContext";
import addLazyElement from "./addLazyElement";
import { componentType } from "./types";
import { invokeAll } from "./util";

export default function createComponentRenderer(
  mount,
  context,
  marker,
  content
) {
  let { render, props, forceUpdate, lazy } = content;
  let inner = createData(marker, "component");
  let currentProps = props;
  let unmounted = false;
  let propsProxy;
  let effects = [];
  let mounted = false;
  let removeUpdateListener;
  let removeScrollUpdateListener;
  let isVisibleInViewport = !lazy;
  let componentContext = { ...context };
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
      removeUpdateListener = context.addBinding(runEffects);
      runEffects();
    }
  }, componentContext);

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

  if (lazy) {
    removeScrollUpdateListener = addLazyElement(marker, () =>
      reactiveHandler(render)
    );
  }

  return {
    type: componentType,
    render,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      removeUpdateListener && removeUpdateListener();
      removeScrollUpdateListener && removeScrollUpdateListener();
      invokeAll(effects, undefined, "dispose");
      inner.unmount();
    },
    reorder: inner.reorder,
    update({ ref, props }) {
      currentProps = props;
      isVisibleInViewport &&
        (!mounted || forceUpdate) &&
        reactiveHandler(render);
    },
  };
}
