import isPromiseLike from "../core/isPromiseLike";
import { failedType, loadedType, loadingType } from "../core/types";
import { assign } from "../core/util";

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

  load(initial);

  Object.defineProperties(getValue, {
    load: { value: load },
    value: {
      get: getValue,
    },
    error: {
      get() {
        return error;
      },
    },
    status: {
      get() {
        return status;
      },
    },
  });

  return assign(getValue, {
    then(onResolve, onReject) {
      return promise.then(onResolve, onReject);
    },
    finally(onFinally) {
      return promise.finally(onFinally);
    },
    catch(onCatch) {
      return promise.catch(onCatch);
    },
  });
}
