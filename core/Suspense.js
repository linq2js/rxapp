import createComponent from "./createComponent";
import createCustomRenderer from "./createCustomRenderer";
import getPromiseLoadable from "./getPromiseLoadable";
import globalContext from "./globalContext";
import { failedType, loadingType } from "./types";

let Suspense = createComponent((props) => {
  let doMount;

  function handlePromise(promise) {
    let promiseLoadable = getPromiseLoadable(promise);
    if (promiseLoadable.status === loadingType) {
      doMount(props.fallback);
      promise.finally(() => doMount(props.children));
    } else if (promiseLoadable.status === failedType) {
      throw promiseLoadable.error;
    } else {
      doMount(props.children);
    }
  }

  return () => {
    return createCustomRenderer((mount, context, data) => {
      doMount = (content) => mount(content, data, content);
      let prevHandlePromise = globalContext.handlePromise;
      try {
        globalContext.handlePromise = handlePromise;
        mount(context, data, props.children);
      } finally {
        globalContext.handlePromise = prevHandlePromise;
      }
    });
  };
});

export default Suspense;
