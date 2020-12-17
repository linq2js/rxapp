import createEmitter from "./createEmitter";
import createMarker from "./createMarker";
import isIteratorLike from "./isIteratorLike";
import isPromiseLike from "./isPromiseLike";
import mountContent from "./mountContent";
import { loadableType, loadingType } from "./types";
import { doc, emptyObject, enqueue, isArray } from "./util";

export default function mount(content, options = emptyObject) {
  if (typeof options === "string") options = { container: options };
  let {
    container = doc.body,
    init /*, hydrate*/,
    store,
    actions = emptyObject,
    middleware,
  } = options;

  let updateEmitter = createEmitter();
  let data = {
    marker: createMarker("app"),
  };
  let updating = false;
  let context = {
    appId: Symbol("app"),
    shared: {},
    update,
    dispatch,
    addBinding: updateEmitter.on,
    updateToken: 0,
    action: (fn) => (payload) => dispatch(fn, payload),
    actions: {},
    dispose,
    subscribe: updateEmitter.on,
  };
  if (typeof container === "string") container = doc.querySelector(container);
  if (container.$$app) container.$$app.dispose();
  container.$$app = context;

  container.innerHTML = "";
  container.appendChild(data.marker);

  function dispose() {}

  function update() {
    if (!updating) {
      updating = true;
      enqueue(() => {
        updating = false;
        context.updateToken = Symbol();
        updateEmitter.emit();
      });
    }
  }

  function dispatch(action, payload) {
    try {
      let result = action(payload);
      if (result && result.call) result = result(context);
      if (isPromiseLike(result)) return result.finally(update);
      if (isIteratorLike(result)) result = handleIterator(context, result);
      return result;
    } finally {
      update();
    }
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
