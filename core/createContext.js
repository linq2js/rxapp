import createComponent from "./createComponent";
import createCustomRenderer from "./createCustomRenderer";
import globalContext from "./globalContext";

export default function createContext(defaultValue) {
  let key = Symbol("context");
  let defaultContextData = createContextData(() => defaultValue);
  let Provider = createComponent((props) => {
    let contextData = createContextData(() =>
      typeof props.value === "function" ? props.value() : props.value
    );
    // create reactive
    return function () {
      return createCustomRenderer((mount, context, data) => {
        let prevContextData = globalContext[key];
        try {
          globalContext[key] = contextData;
          mount(context, data, props.children);
        } finally {
          globalContext[key] = prevContextData;
        }
      });
    };
  });
  function consume() {
    return globalContext[key] || defaultContextData;
  }

  return [Provider, consume];
}

function createContextData(getter) {
  Object.defineProperty(getter, "current", {
    get() {
      return getter();
    },
  });
  return getter;
}
