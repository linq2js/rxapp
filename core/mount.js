import createMarker from "./createMarker";
import mountContent from "./mountContent";
import { doc, emptyObject } from "./util";

export default function mount(content, options) {
  if (typeof options === "string") options = { container: options };
  let { container = doc.body, init /*, hydrate*/ } = options || emptyObject;
  let data = {
    marker: createMarker("app"),
  };
  let context = { shared: {} };
  if (typeof container === "string") container = doc.querySelector(container);
  container.innerHTML = "";
  container.appendChild(data.marker);

  mountContent(context, data, content);

  typeof init === "function" && init();
}

export function mountMethod(options) {
  return mount(this, options);
}
