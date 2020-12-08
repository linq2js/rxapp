import createComponent from "../core/createComponent";
import createCustomRenderer from "../core/createCustomRenderer";
import getPromiseLoadable from "../core/getPromiseLoadable";
import { loadingType } from "../core/types";

/**
 * create a lazy component that renders given dynamic import component
 * @param importFn
 * @param fallback
 * @return {*}
 */
export default function lazy(importFn, fallback) {
  let loadable;
  let hasFallback = arguments.length > 1;
  return createComponent(
    (props) => {
      if (!loadable) {
        loadable = getPromiseLoadable(importFn(...arguments));
      }
      // create reactive
      return createCustomRenderer((mount, context, data) => {
        if (loadable.status === loadingType) {
          if (hasFallback) return mount(context, data, fallback);
          throw loadable.promise;
        }
        mount(context, data, loadable.value.default(props));
      });
    },
    { forceUpdate: true }
  );
}
