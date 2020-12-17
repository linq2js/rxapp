import createArrayKeyedMap from "./createArrayKeyedMap";
import { mountMethod } from "./mount";
import { htmlType, templateType } from "./types";
import { slice } from "./util";

let uid = 0;
let cache = createArrayKeyedMap(() => uid++);

export default function createTemplate(onUpdate, args) {
  let strings = args[0];
  if (strings.length === 1)
    return {
      type: htmlType,
      value: strings[0],
    };

  let values = slice.call(args, 1);

  return {
    id: cache.get(strings),
    onUpdate,
    type: templateType,
    strings,
    values,
    mount: mountMethod,
  };
}
