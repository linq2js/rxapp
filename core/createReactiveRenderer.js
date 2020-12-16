import createData from "./createData";
import { createReactiveHandler } from "./createReactiveHandler";
import { reactiveType } from "./types";
import { emptyObject } from "./util";

export default function createReactiveRenderer(
  mount,
  context,
  marker,
  reactiveFn
) {
  let inner = createData(marker, "reactive");
  let unmounted = false;
  let updateToken;
  let reactiveHandler = createReactiveHandler(
    (result) => {
      if (unmounted || updateToken === context.updateToken) return;
      updateToken = context.updateToken;
      mount(context, inner, result);
    },
    emptyObject,
    context
  );
  let unsubscribe = context.addBinding(update);

  function update() {
    if (unmounted) return;
    reactiveHandler(reactiveFn);
  }

  update();

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
      reactiveFn = nextReactiveFn;
    },
  };
}
