import arrayEqual from "./arrayEqual";
import isEqual from "./isEqual";
import { isMemo } from "./types";
import { assign, unset } from "./util";

export default function createMemo(fn) {
  if (arguments.length > 1)
    return createMemoWithSelector(arguments[0], arguments[1]);
  let lastResult;
  let lastArgs;
  return assign(
    (...args) => {
      if (lastArgs && arrayEqual(args, lastArgs)) return lastResult;
      return (lastResult = fn.apply(null, (lastArgs = args)));
    },
    {
      [isMemo]: true,
    }
  );
}

function createMemoWithSelector(selector, fn) {
  let last;
  return assign(
    function () {
      let value = selector.apply(null, arguments);
      if (last && isEqual(value, last.value)) {
        return last.result;
      }
      last = { value, result: fn(value, ...arguments) };
      return last.result;
    },
    {
      [isMemo]: true,
    }
  );
}

assign(createMemo, {
  list(fn) {
    if (arguments.length > 1) fn = createMemo(...arguments);
    let cache = [];
    let prev;
    return createMemo((array, ...args) => {
      cache.length = array.length;
      let changes = 0;
      let result = array.map((value, index) => {
        let itemCache = cache[index];
        if (!itemCache) {
          cache[index] = itemCache = createMemo(fn);
          itemCache.prev = unset;
        }
        let next = itemCache(value, index, ...args);
        if (next !== itemCache.prev) {
          changes++;
          itemCache.prev = next;
        }
        return next;
      });
      return changes ? (prev = result) : prev;
    });
  },
});
