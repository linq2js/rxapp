import createArrayKeyedMap from "./createArrayKeyedMap";
import { mountMethod } from "./mount";
import { htmlType, templateType } from "./types";
import { assign, slice } from "./util";

let uid = 0;
let cache = createArrayKeyedMap(() => uid++);

export default function createTemplate(key, args) {
  if (typeof args[0] === "string") {
    return {
      type: htmlType,
      value: args[0],
    };
  }
  let strings = args[0];
  let values = slice.call(args, 1);
  let template = {
    id: cache.get(strings),
    key,
    type: templateType,
    strings,
    values,
    mount: mountMethod,
  };

  return assign(() => template, template);
}
