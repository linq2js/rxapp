import createTemplate from "./createTemplate";
import { mountMethod } from "./mount";
import { componentType } from "./types";
import { assign, emptyObject, isArray, slice, unset } from "./util";

export default function createComponent(render, options = emptyObject) {
  let { lazy, pure, fallback } = options;
  let defWithoutProps = {
    key: null,
    ref: null,
    lazy,
    fallback,
    hasFallback: "fallback" in options,
    pure,
    type: componentType,
    render,
    props: emptyObject,
    mount: mountMethod,
    withProps(newProps) {
      return createComponent(render, options)(newProps);
    },
  };
  return assign(function () {
    // children template
    if (isArray(arguments[0])) {
      return {
        ...defWithoutProps,
        props: { children: createTemplate(null, arguments) },
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
            children: createTemplate(null, arguments),
          },
        };
      }
      return defWithProps;
    }, defWithProps);
  }, defWithoutProps);
}
