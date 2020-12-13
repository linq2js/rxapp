import createData from "./createData";
import {createReactiveHandler} from "./createReactiveHandler";
import { isMemo, noChangeType, reactiveType } from "./types";
import { emptyObject, unset } from "./util";

export default function createReactiveRenderer(
  mount,
  context,
  marker,
  reactiveFn
) {
  let inner = createData(marker, "reactive");
  let unmounted = false;
  let reactiveFnWrapper;

  let reactiveHandler = createReactiveHandler(
    (result) => {
      if (unmounted) return;
      // skip rendering if the result is noChange
      result !== noChangeType && mount(context, inner, result);
    },
    emptyObject,
    context
  );
  let unsubscribe = context.addBinding(update);

  // update();

  function update() {
    if (unmounted) return;
    reactiveHandler(reactiveFnWrapper);
  }

  function changeReactiveFn(fn) {
    if (reactiveFnWrapper && fn === reactiveFn) return;
    reactiveFn = fn;
    reactiveFnWrapper = reactiveFn[isMemo]
      ? createMemoWrapper(reactiveFn)
      : reactiveFn;
  }

  changeReactiveFn(reactiveFn);

  return {
    type: reactiveType,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      unsubscribe();
      inner.unmount();
    },
    reorder: inner.reorder,
    update(nextReactiveFn) {
      changeReactiveFn(nextReactiveFn);
      update();
    },
  };
}

function createMemoWrapper(fn) {
  let lastResult = unset;
  return function () {
    let result = fn.apply(null, arguments);
    if (lastResult === result) return noChangeType;
    return (lastResult = result);
  };
}
