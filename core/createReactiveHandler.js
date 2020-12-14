import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";

export function createReactiveHandler(processor, props, context, component) {
  let asyncHandler = context.asyncHandler;
  let lastPromise;
  return function (fn) {
    let prevComponent = globalContext.component;
    try {
      component && (globalContext.component = component);
      let result = fn(props, context);
      if (isPromiseLike(result)) {
        let promise = (lastPromise = result);
        promise.then((asyncResult) => {
          (!component || !component.unmounted) &&
            lastPromise === promise &&
            processor(asyncResult);
        });
        return;
      }
      lastPromise = null;
      return processor(result);
    } catch (e) {
      if (isPromiseLike(e) && asyncHandler) return asyncHandler(e);
      throw e;
    } finally {
      globalContext.component = prevComponent;
    }
  };
}
