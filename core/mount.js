import createEmitter from "./createEmitter";
import createMarker from "./createMarker";
import globalContext from "./globalContext";
import isIteratorLike from "./isIteratorLike";
import isPromiseLike from "./isPromiseLike";
import mountContent from "./mountContent";
import { doc, emptyObject, enqueue, isArray } from "./util";

export default function mount(content, options = emptyObject) {
  if (typeof options === "string") options = { container: options };
  let {
    container = doc.body,
    onInit /*, hydrate*/,
    onUpdate,
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
    createReactiveHandler,
    updateToken: Symbol(),
    action: (fn) => (payload) => dispatch(fn, payload),
    actions: {},
  };
  if (typeof container === "string") container = doc.querySelector(container);
  container.innerHTML = "";
  container.appendChild(data.marker);

  function update() {
    // return updateEmitter.emit();
    let token = (context.updateToken = Symbol());
    enqueue(() => {
      if (token !== context.updateToken) return;
      updateEmitter.emit();
      onUpdate && dispatch(onUpdate, context);
    });
  }

  function createReactiveHandler(
    processor,
    customContext = context,
    component = globalContext.component
  ) {
    let asyncHandler = context.asyncHandler;
    return function (fn) {
      try {
        let result = fn(component.props, customContext);
        return processor(result);
      } catch (e) {
        if (isPromiseLike(e) && asyncHandler) return asyncHandler(e);
        throw e;
      }
    };
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

  typeof onInit === "function" && dispatch(onInit, context);

  return context;
}

export function mountMethod(options) {
  return mount(this, options);
}

function handleIterator(context, iterator) {
  function next(payload) {
    let { done, value } = iterator.next(payload);
    if (done) return value;
    if (isPromiseLike(value)) return value.then(next);
    if (isArray(value) && typeof value[0] === "function") {
      return context.dispatch(...value);
    }
    return next(value);
  }

  return next();
}
