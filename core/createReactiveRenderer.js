import createData from "./createData";
import { reactiveType } from "./types";

export default function createReactiveRenderer(
  mount,
  context,
  marker,
  reactiveFn
) {
  let inner = createData(marker, "reactive");
  let unmounted = false;

  let reactiveHandler = context.createReactiveHandler((result) => {
    if (unmounted) return;
    mount(context, inner, result);
  });
  let unsubscribe = context.addBinding(update);

  // update();

  function update() {
    if (unmounted) return;
    reactiveHandler(reactiveFn);
  }

  return {
    type: reactiveType,
    unmount() {
      if (unmounted) return;
      unmounted = true;
      unsubscribe();
      inner.unmount();
    },
    reorder: inner.reorder,
    update,
  };
}
