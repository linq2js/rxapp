import createTemplate from "./createTemplate";
import { mountMethod } from "./mount";
import { componentType } from "./types";
import { assign, emptyObject, isArray, slice } from "./util";

export default function createComponent(
  render,
  { forceUpdate, lazy } = emptyObject
) {
  let defWithoutProps = {
    key: void 0,
    ref: null,
    type: componentType,
    render,
    props: emptyObject,
    mount: mountMethod,
    forceUpdate,
    lazy,
  };
  return assign(function () {
    // children template
    if (isArray(arguments[0])) {
      return {
        ...defWithoutProps,
        props: { children: createTemplate(void 0, arguments) },
      };
    }
    let { key, ref, ...props } = arguments[0] || emptyObject;
    let defWithProps = {
      ...defWithoutProps,
      key,
      ref,
      hasProps: true,
      props:
        arguments.length > 1 && !(props && "children" in props)
          ? { ...props, children: slice.call(arguments, 1) }
          : props || emptyObject,
    };
    return assign(function () {
      if (isArray(arguments[0])) {
        return {
          ...defWithProps,
          props: {
            ...defWithProps.props,
            children: createTemplate(void 0, arguments),
          },
        };
      }
      return defWithProps;
    }, defWithProps);
  }, defWithoutProps);
}
