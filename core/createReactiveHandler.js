import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";

export function createReactiveHandler(processor, props, context, component) {
  let asyncHandler = context.asyncHandler;
  return function (fn) {
    let prevComponent = globalContext.component;
    try {
      component && (globalContext.component = component);
      let result = fn(props, context);
      return processor(result);
    } catch (e) {
      if (isPromiseLike(e) && asyncHandler) return asyncHandler(e);
      throw e;
    } finally {
      globalContext.component = prevComponent;
    }
  };
}
