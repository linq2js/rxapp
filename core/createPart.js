import createTemplate from "./createTemplate";
import { htmlType } from "./types";

export default function createPart(input) {
  if (input) {
    let type = typeof input;
    if (type === "function") {
      return function () {
        return createTemplate(input, arguments);
      };
    }
    if (type === "string") {
      return {
        type: htmlType,
        value: input,
      };
    }
  }

  return createTemplate(void 0, arguments);
}
