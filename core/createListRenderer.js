import createMarker from "./createMarker";
import { listType } from "./types";

export default function createListRenderer(mount, context, marker) {
  let prevChildren = [];
  let prevList;
  let prevLength;

  return {
    type: listType,
    reorder() {
      prevChildren.some((prevChild) => {
        marker.before(prevChild.marker);
        prevChild.reorder();
      });
    },
    update(list) {
      if (list === prevList && prevLength === list.length) return;
      prevList = list;
      prevLength = list.length;

      let nextChildren = Array(list.length);
      let nextKeyToIndex = new Map();
      let container = marker.parentNode;

      // build next list
      list.some((nextItem, i) => {
        let nextKey = nextItem && nextItem.key;
        if (nextKey === void 0 || nextKey === null) nextKey = i;
        nextChildren[i] = { item: list[i], key: nextKey };
        nextKeyToIndex.set(nextKey, i);
      });
      let prevKeyToIndex = new Map();
      let orphanChildrenIndices = [];

      let i = 0;
      // remove prev children which is not in next list
      prevChildren.some((prevChild, index) => {
        if (!nextKeyToIndex.has(prevChild.key)) {
          orphanChildrenIndices.push(index);
        } else {
          prevKeyToIndex.set(prevChild.key, i++);
        }
      });

      while (orphanChildrenIndices.length) {
        let prevIndex = orphanChildrenIndices.pop();
        let prevChild = prevChildren[prevIndex];
        prevChildren.splice(prevIndex, 1);
        prevChild.renderer.unmount();
      }

      // process add and insert
      let lastMarker;

      nextChildren.some((nextChild, index) => {
        let prevIndex = prevKeyToIndex.get(nextChild.key);
        // is new, append to container
        if (prevIndex === void 0) {
          // reuse unmounted child
          lastMarker = nextChild.marker = createMarker("item " + index);
          container.appendChild(nextChild.marker);
          mount(context, nextChild, nextChild.item);
        } else {
          let prevChild = prevChildren[prevIndex];
          if (prevIndex !== index) {
            prevChildren[prevIndex] = prevChildren[index];
            lastMarker
              ? lastMarker.after(prevChild.marker)
              : container.appendChild(prevChild.marker);
            prevChild.renderer.reorder();
            if (prevChild.item !== nextChild.item) {
              // remount
              mount(context, prevChild, nextChild.item);
            }
          } else if (prevChild.item !== nextChild.item) {
            mount(context, prevChild, nextChild.item);
          }
          nextChildren[index] = prevChild;
          lastMarker = prevChild.marker;
        }
      });

      prevChildren = nextChildren;
    },
    unmount() {
      prevChildren.some((prevChild) => {
        prevChild.renderer.unmount();
      });
    },
  };
}
