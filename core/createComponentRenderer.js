import arrayEqual from "./arrayEqual";
import createData from "./createData";
import globalContext from "./globalContext";
import addLazyElement from "./addLazyElement";
import { componentType } from "./types";
import {assign, emptyObject, invokeAll} from "./util";

export default function createComponentRenderer(
  mount,
  context,
  marker,
  content
) {
  let { render, props, forceUpdate, lazy } = content;
  let inner = createData(marker, "component");
  let currentProps = props;
  let currentRef;
  let unmounted = false;
  let effects = [];
  let mounted = false;
  let removeUpdateListener;
  let removeScrollUpdateListener;
  let isVisibleInViewport = !lazy;
  let componentContext = { ...context };
  let component = (globalContext.component = {
    handle: emptyObject,
    props: currentProps,
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
      let data = effects[i];
      let currentDeps = data.deps ? data.deps(component.props, context) : [];
      if (!arrayEqual(currentDeps, data.prevDeps)) {
        data.prevDeps = currentDeps;
        data.dispose && data.dispose();
        data.dispose = data.effect();
      }
    }
  }

  function addEffect(effect, deps) {
    if (mounted)
      throw new Error("Cannot add effect after the component mounted");
    effects.push({ effect, deps });
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
      if (ref !== currentRef) {
        currentRef = ref;
        typeof currentRef === "function"
          ? currentRef(component.handle)
          : (currentRef.current = component.handle);
      }

      for (let p in currentProps) {
        if (p in props) continue;
        delete currentProps[p];
      }
      assign(currentProps, props);
      isVisibleInViewport &&
        (!mounted || forceUpdate) &&
        reactiveHandler(render);
    },
  };
}
