import createComponent from "./createComponent";
import createCustomRenderer from "./createCustomRenderer";
import globalContext from "./globalContext";
import { unset } from "./util";

export default function createContext(defaultValue) {
  let key = Symbol("context");
  let provider = createComponent(
    (props) => {
      let prevValue = unset;
      let consumers = new Set();
      let contextInstance = { addConsumer };

      function addConsumer(consumer) {
        consumers.add(consumer);
      }

      return () => {
        let { value, children } = props;
        return createCustomRenderer((mount, context, data) => {
          let prevContextInstance = globalContext[key];
          let oldConsumers = [...consumers];
          try {
            consumers.clear();
            contextInstance.value = value;
            globalContext[key] = contextInstance;
            mount(context, data, children);
          } finally {
            if (prevValue !== value) {
              prevValue = value;
              let i = oldConsumers.length;
              while (i--) {
                if (consumers.has(oldConsumers[i])) continue;
                oldConsumers[i].forceUpdate();
              }
            }
            globalContext[key] = prevContextInstance;
          }
        });
      };
    },
    { pure: false }
  );

  function consume() {
    let componentInstance = globalContext.component;
    let contextInstance = componentInstance[key];
    if (!contextInstance) {
      componentInstance[key] = contextInstance = globalContext[key];
    }
    if (!contextInstance) return defaultValue;
    contextInstance.addConsumer(componentInstance);
    return contextInstance.value;
  }

  return [provider, consume];
}
