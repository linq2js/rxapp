import createComponent from "./createComponent";
import createTemplate from "./createTemplate";
import { assign } from "./util";

export default function createPart() {
  if (typeof arguments[0] === "function")
    return createComponent.apply(null, arguments);
  return createTemplate(null, arguments);
}

assign(createPart, {
  key(key) {
    return function () {
      return createTemplate(key, arguments);
    };
  },
});
