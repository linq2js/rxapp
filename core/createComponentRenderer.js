import createData from "./createData";
import createEffectManager from "./createEffectManager";
import { createReactiveHandler } from "./createReactiveHandler";
import globalContext from "./globalContext";
import addLazyElement from "./addLazyElement";
import { componentType } from "./types";
import { assign, emptyObject } from "./util";

export default function createComponentRenderer(
  mount,
  context,
  marker,
  content
) {
  let { render, props, forceUpdate, lazy } = content;
  let inner = createData(marker, "component");
  let currentProps = { ...props };
  let currentRef;
  let removeUpdateListener;
  let removeScrollUpdateListener;
  let isVisibleInViewport = !lazy;
  let component = {
    handle: emptyObject,
    props: currentProps,
    mounted: false,
    unmounted: false,
  };
  let effects = createEffectManager(component, context);
  let reactiveHandler = createReactiveHandler(
    (result) => {
      let prevComponent = globalContext.component;
      try {
        globalContext.component = component;
        !component.unmounted && mount(context, inner, result);
      } finally {
        globalContext.component = prevComponent;
      }
      if (!component.mounted) {
        component.mounted = true;
        removeUpdateListener = context.addBinding(effects.run);
        effects.run();
      }
    },
    currentProps,
    context
  );

  if (lazy) {
    removeScrollUpdateListener = addLazyElement(marker, () =>
      reactiveHandler(render)
    );
  }

  return {
    type: componentType,
    render,
    unmount() {
      if (component.unmounted) return;
      component.unmounted = true;
      removeUpdateListener && removeUpdateListener();
      removeScrollUpdateListener && removeScrollUpdateListener();
      effects.dispose();
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
        (!component.mounted || forceUpdate) &&
        reactiveHandler(render);
    },
  };
}
