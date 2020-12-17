import { htmlType } from "./types";
import { doc } from "./util";

export default function createHtmlRenderer(mount, context, marker, { value }) {
  let ns = marker.parentNode && marker.parentNode.namespaceURI;
  let template = ns
    ? doc.createElementNS(ns, "template")
    : doc.createElement("template");
  template.innerHTML = value;
  let childNodes = [...(template.content || template).childNodes];

  function reorder() {
    marker.before(...childNodes);
  }

  reorder();

  return {
    type: htmlType,
    update: noop,
    unmount() {
      childNodes.some((childNode) => {
        childNode.remove();
      });
    },
    reorder,
  };
}
