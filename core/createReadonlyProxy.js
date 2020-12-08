import { emptyObject } from "./util";

export default function createReadonlyProxy(getter) {
  return new Proxy(emptyObject, {
    get(target, p, receiver) {
      return getter()[p];
    },
    ownKeys(target) {
      return Object.keys(getter());
    },
    getOwnPropertyDescriptor(target, p) {
      return {
        value: getter()[p],
        enumerable: true,
        configurable: true,
      };
    },
  });
}
