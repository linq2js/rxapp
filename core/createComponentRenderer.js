import createData from "./createData";
import getPromiseLoadable from "./getPromiseLoadable";
import globalContext from "./globalContext";
import gc from "./globalContext";
import isPromiseLike from "./isPromiseLike";
import objectEqual from "./objectEqual";
import { componentType, loadingType } from "./types";

export default function createComponentRenderer(
  mount,
  context,
  marker,
  content
) {
  if (content.lazy)
    return createLazyComponentRenderer(mount, context, marker, content);

  let { pure, render, props } = content;
  let inner = createData(marker, "component");
  let handlePromise = globalContext.handlePromise;
  let componentInstance = {
    forceUpdate,
    addEffect,
  };
  let propsProxy = new Proxy(
    {},
    {
      get(target, p, receiver) {
        return currentProps[p];
      },
      ownKeys(target) {
        return Object.keys(currentProps);
      },
      getOwnPropertyDescriptor(target, key) {
        return {
          value: currentProps[key],
          enumerable: true,
          configurable: true,
        };
      },
    }
  );
  let mounted = false;
  let currentProps = props;
  let error;
  let unsubscribes = [];
  let effects = [];
  let onUnmount = [];
  let unmounted = false;
  let renderResult = wrapContext(render, propsProxy);
  let dynamicRender =
    typeof renderResult === "function" && !renderResult.type
      ? renderResult
      : null;

  function handleStoreUpdate(subscribe) {
    unsubscribes.push(subscribe(forceUpdate));
  }

  function addEffect(effect) {
    !mounted && effects.push(effect);
  }

  function wrapContext(fn, payload, storeChangeHook) {
    let prevComponent = gc.component;
    let prevHandleStoreUpdate = gc.handleStoreUpdate;
    try {
      unsubscribeAll();
      storeChangeHook && (gc.handleStoreUpdate = handleStoreUpdate);
      gc.component = componentInstance;
      return fn(payload);
    } catch (e) {
      if (isPromiseLike(e) && handlePromise) return handlePromise(e);
      throw e;
    } finally {
      gc.component = prevComponent;
      storeChangeHook && (gc.handleStoreUpdate = prevHandleStoreUpdate);
    }
  }

  function unsubscribeAll() {
    let i = unsubscribes.length;
    while (i--) unsubscribes[i]();
    unsubscribes = [];
  }

  function forceUpdate() {
    if (unmounted || !dynamicRender) return;
    if (error) {
      let e = error;
      error = null;
      throw e;
    }
    let result = wrapContext(dynamicRender, undefined, true);
    mount(context, inner, result);
  }

  return {
    type: componentType,
    render,
    unmount() {
      unmounted = true;
      unsubscribeAll();
      inner.unmount();
      let i = onUnmount.length;
      while (i--) onUnmount[i]();
    },
    reorder: inner.reorder,
    update({ ref, props }) {
      if (pure !== false && mounted && objectEqual(currentProps, props)) return;

      try {
        currentProps = props;
        if (dynamicRender) {
          forceUpdate();
        } else if (!mounted) {
          mount(context, inner, renderResult);
        }
        if (!mounted) {
          for (let i = 0; i < effects.length; i++) {
            let result = effects[i]();
            typeof result === "function" && onUnmount.push(result);
          }
          effects.length = 0;
        }
      } finally {
        mounted = true;
      }
    },
  };
}

function createLazyComponentRenderer(mount, context, marker, content) {
  let { render, fallback, hasFallback } = content;
  let inner = createData(marker, "lazy");
  let promise;
  let loadable;
  let handlePromise = globalContext.handlePromise;
  let currentProps;

  function forceUpdate() {
    if (loadable.status === loadingType) {
      if (hasFallback) return mount(context, inner, fallback);
      if (handlePromise) return handlePromise(promise);
      return;
    }
    let component = loadable.value.default || loadable.value;
    mount(
      context,
      inner,
      component.withProps ? component.withProps(currentProps) : component
    );
  }
  return {
    type: componentType,
    render,
    unmount: inner.unmount,
    reorder: inner.reorder,
    update({ props }) {
      currentProps = props;
      if (!loadable) {
        promise = render();
        loadable = getPromiseLoadable(promise);
        if (loadable.status === loadingType) promise.then(forceUpdate);
      }
      forceUpdate();
    },
  };
}
