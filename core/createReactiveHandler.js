import isPromiseLike from "./isPromiseLike";

export function createReactiveHandler(processor, props, context) {
  let asyncHandler = context.asyncHandler;
  return function (fn) {
    try {
      let result = fn(props, context);
      return processor(result);
    } catch (e) {
      if (isPromiseLike(e) && asyncHandler) return asyncHandler(e);
      throw e;
    }
  };
}
