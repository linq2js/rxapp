import createComponent from "../core/createComponent";
import createCustomRenderer from "../core/createCustomRenderer";

/**
 * Suspense component
 */
let Suspense = createComponent((props) => {
  return () =>
    createCustomRenderer((mount, context, data) => {
      let prevAsyncHandler = context.asyncHandler;
      let renderChildren = () => mount(context, data, props.children);
      try {
        context.asyncHandler = (promise) => {
          mount(context, data, props.fallback);
          promise.finally
            ? promise.finally(renderChildren)
            : promise.then(renderChildren, renderChildren);
        };
        renderChildren();
      } finally {
        context.asyncHandler = prevAsyncHandler;
      }
    });
});

export default Suspense;
