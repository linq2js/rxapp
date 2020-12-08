import createData from "./createData";
import { reactiveType } from "./types";

export default function createReactiveRenderer(
  mount,
  context,
  marker,
  reactiveFn
) {
  let inner = createData(marker, "reactive");

  let reactiveHandler = context.createReactiveHandler((result) =>
    mount(context, inner, result)
  );
  let unsubscribe = context.addBinding(update);

  // update();

  function update() {
    reactiveHandler(reactiveFn);
  }

  return {
    type: reactiveType,
    unmount() {
      unsubscribe();
      inner.unmount();
    },
    reorder: inner.reorder,
    update,
  };
}
