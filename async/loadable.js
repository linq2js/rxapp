import createMemo from "../core/createMemo";
import isPromiseLike from "../core/isPromiseLike";
import {
  failedType,
  loadableType,
  loadedType,
  loadingType,
} from "../core/types";
import { assign, emptyArray, getters } from "../core/util";

/**
 * create a loadable data logic with initial value
 * @param initial
 * @return {(function(): *)|*}
 */
export default function loadable(initial) {
  let value, status, promise, originalPromise, resolve, reject, error;

  function load(nextValue) {
    if (isPromiseLike(nextValue)) {
      originalPromise = nextValue;
      // already done
      if (status !== loadingType) {
        promise = new Promise(function () {
          [resolve, reject] = arguments;
        });
      }
      status = loadingType;
      nextValue.then(
        (result) => {
          if (originalPromise !== nextValue) return;
          value = result;
          status = loadedType;
          resolve(value);
        },
        (reason) => {
          if (originalPromise !== nextValue) return;
          error = reason;
          status = failedType;
          reject(error);
        }
      );
    } else if (nextValue instanceof Error) {
      status = failedType;
      originalPromise = null;
      error = nextValue;
    } else {
      status = loadedType;
      originalPromise = null;
      error = null;
      value = nextValue;
      promise = Promise.resolve(value);
    }
  }

  function getValue() {
    if (status === loadingType) throw promise;
    if (status === failedType) throw error;
    return value;
  }

  function map(mapper, deps) {
    return mapLoadable(getValue, mapper, deps);
  }

  assign(
    getters(getValue, {
      error: () => error,
      value: getValue,
      status: () => status,
    }),
    {
      type: loadableType,
      load,
      map,
      then(onResolve, onReject) {
        return promise.then(onResolve, onReject);
      },
      finally(onFinally) {
        return promise.finally(onFinally);
      },
      catch(onCatch) {
        return promise.catch(onCatch);
      },
    }
  );

  load(initial);

  return getValue;
}

function mapLoadable(loadable, mapper, deps) {
  let memoizedValue = createMemo(mapper);
  return getters(
    {
      then: loadable.then,
      finally: loadable.finally,
      catch: loadable.catch,
    },
    {
      value() {
        let result = memoizedValue(
          loadable.value,
          ...(deps ? deps() || emptyArray : emptyArray)
        );
        return result;
      },
      error: () => loadable.error,
      status: () => loadable.status,
    }
  );
}
