import createEffectManager from "./createEffectManager";
import createEmitter from "./createEmitter";
import createMarker from "./createMarker";
import isIteratorLike from "./isIteratorLike";
import isPromiseLike from "./isPromiseLike";
import mountContent from "./mountContent";
import { loadableType, loadingType } from "./types";
import { doc, emptyObject, enqueue, isArray } from "./util";

let threshold = 1500;

export default function mount(content, options = emptyObject) {
  if (typeof options === "string") options = { container: options };
  let {
    container = doc.body,
    init /*, hydrate*/,
    store,
    actions = emptyObject,
    middleware,
  } = options;

  let updateEmitter = createEmitter().get("update");
  let data = {
    marker: createMarker("app"),
  };

  let context = {
    appId: Symbol("app"),
    shared: {},
    update,
    dispatch,
    addBinding: updateEmitter.on,
    updateToken: Symbol(),
    action: (fn) => (payload) => dispatch(fn, payload),
    actions: {},
    dispose,
  };
  let defaultComponent = {};
  if (typeof container === "string") container = doc.querySelector(container);
  if (container.$$app) container.$$app.dispose();
  container.$$app = context;
  let effects = createEffectManager(defaultComponent, context);

  container.innerHTML = "";
  container.appendChild(data.marker);

  function dispose() {
    effects.dispose();
  }

  function update() {
    // return updateEmitter.emit();
    let token = (context.updateToken = Symbol());
    enqueue(() => {
      if (token !== context.updateToken) return;
      let removedNodes = (context.removedNodes = new Map());
      try {
        updateEmitter.emit();
      } finally {
        if (removedNodes.size) {
          for (let nodeGroup of removedNodes.values()) {
            while (nodeGroup.length) {
              let nodes = nodeGroup.pop();
              while (nodes.length) nodes.pop().remove();
            }
          }
        }
      }
      effects.run();
    }, updateEmitter.length() > threshold);
  }

  function dispatch(action, payload) {
    try {
      let result = action(payload);
      if (typeof result === "function") result = result(context);
      if (isPromiseLike(result)) return result.finally(update);
      if (isIteratorLike(result)) result = handleIterator(context, result);
      return result;
    } finally {
      update();
    }
  }

  if (options.effects) {
    options.effects.forEach((effect) =>
      isArray(effect) ? effects.add(...effect) : effects.add(effect)
    );
  }

  if (store) {
    store.subscribe(update);
    context.select = (selector) => selector(store.getState());
    if (store.dispatch) {
      let originalDispatch = context.dispatch;
      context.dispatch = function (action) {
        if (typeof action === "function")
          return originalDispatch(action, arguments[1]);
        return store.dispatch(...arguments);
      };
    }
  }

  for (let actionName in actions) {
    context.actions[actionName] = context.action(actions[actionName]);
  }

  middleware && (context = middleware(context, options));

  mountContent(context, data, content);

  typeof init === "function" && dispatch(init, context);
  effects.run();

  return context;
}

export function mountMethod(options) {
  return mount(this, options);
}

function handleIterator(context, iterator) {
  function next(payload) {
    let { done, value } = iterator.next(payload);
    if (done) return value;
    if (value && value.type === loadableType && value.status !== loadingType)
      return next(value.value);
    if (isPromiseLike(value)) return value.then(next);
    if (typeof value === "function") return context.dispatch(value, context);

    if (isArray(value) && typeof value[0] === "function") {
      return context.dispatch(...value);
    }
    return next(value);
  }

  return next();
}
