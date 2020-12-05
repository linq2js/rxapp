import createMarker from "./createMarker";
import { noop } from "./util";

let defaultRenderer = Object.seal(
  Object.freeze({
    reorder: noop,
    update: noop,
    unmount: noop,
  })
);

export default function createData(marker, name) {
  let data = {
    marker: createMarker(name),
    renderer: defaultRenderer,
    unmount() {
      if (data.unmounted) return;
      data.unmounted = true;
      data.unsubscribe && data.unsubscribe();
      data.renderer.unmount();
      data.marker.remove();
      data.dispose && data.dispose();
    },
    reorder() {
      marker.before(data.marker);
      data.renderer.reorder();
    },
  };
  marker.before(data.marker);
  return data;
}
