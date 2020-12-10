import createEmitter from "./createEmitter";
import createMarker from "./createMarker";
import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";
import mountContent from "./mountContent";
import { doc, emptyObject } from "./util";

let enqueue =
  typeof requestAnimationFrame === "undefined"
    ? Promise.resolve().then.bind(Promise.resolve())
    : requestAnimationFrame;

export default function mount(content, options) {
  if (typeof options === "string") options = { container: options };
  let { container = doc.body, init /*, hydrate*/ } = options || emptyObject;
  let emitters = createEmitter();
  let updateEmitter = emitters.get("update");
  let postUpdateEmitter = emitters.get("post_update");
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
      enqueue(() => {
        if (token !== context.updateToken) return;
        postUpdateEmitter.emit();
      });
    });
  }

  function createReactiveHandler(processor, customContext = context) {
    let component = globalContext.component;
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
      if (isPromiseLike(result)) return result.finally(update);
      return result;
    } finally {
      update();
    }
  }

  mountContent(context, data, content);

  typeof init === "function" && init();

  return { update, dispatch };
}

export function mountMethod(options) {
  return mount(this, options);
}
