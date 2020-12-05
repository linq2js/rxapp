import { textType } from "./types";
import { doc, unset } from "./util";

export default function createTextRenderer(mount, context, marker) {
  let textNode = doc.createTextNode("");
  let prevValue = unset;
  marker.before(textNode);
  return {
    type: textType,
    reorder() {
      marker.before(textNode);
    },
    unmount() {
      textNode.remove();
    },
    update(content) {
      if (prevValue === content) return;
      prevValue = content;
      textNode.nodeValue =
        content === null || typeof content === "boolean" || content === void 0
          ? ""
          : "" + content;
    },
  };
}
