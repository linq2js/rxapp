import arrayEqual from "./arrayEqual";
import isEqual from "./isEqual";
import { assign } from "./util";

export default function createMemo(fn) {
  if (arguments.length > 1)
    return createMemoWithSelector(arguments[0], arguments[1]);
  let lastResult;
  let lastArgs;
  return (...args) => {
    if (lastArgs && arrayEqual(args, lastArgs)) return lastResult;
    return (lastResult = fn.apply(null, (lastArgs = args)));
  };
}

function createMemoWithSelector(selector, fn) {
  let last;
  return function () {
    let value = selector.apply(null, arguments);
    if (last && isEqual(value, last.value)) return last.result;
    last = { value, result: fn(value, ...arguments) };
    return last.result;
  };
}

assign(createMemo, {
  list(fn) {
    let cache = [];
    return createMemo((array, ...args) => {
      cache.length = array.length;
      return array.map((value, index) => {
        let itemCache = cache[index];
        if (!itemCache) cache[index] = itemCache = createMemo(fn);
        return itemCache(value, index, ...args);
      });
    });
  },
});
