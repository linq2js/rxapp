import createMarker from "./createMarker";
import { listType } from "./types";

export default function createListRenderer(mount, context, marker) {
  let prevChildren = [];
  let prevList;
  let prevLength;

  return {
    type: listType,
    reorder() {
      for (let i = 0; i < prevChildren.length; i++) {
        marker.before(prevChildren[i].marker);
        prevChildren[i].reorder();
      }
    },
    update(list) {
      if (list === prevList && prevLength === list.length) return;
      prevList = list;
      prevLength = list.length;

      let nextChildren = [];
      let nextKeyToIndex = new Map();
      let container = marker.parentNode;
      let i;

      i = list.length;

      // build next list
      while (i--) {
        let nextItem = list[i];
        let nextKey = nextItem && nextItem.key;
        if (nextKey === void 0 || nextKey === null) nextKey = i;
        nextChildren[i] = { item: list[i], key: nextKey };
        nextKeyToIndex.set(nextKey, i);
      }

      let prevKeyToIndex = new Map();
      let orphanChildrenIndices = [];
      i = 0;
      // remove prev children which is not in next list
      for (let j = 0; j < prevChildren.length; j++) {
        let prevChild = prevChildren[j];
        if (!nextKeyToIndex.has(prevChild.key)) {
          orphanChildrenIndices.push(j);
        } else {
          prevKeyToIndex.set(prevChild.key, i++);
        }
      }

      while (orphanChildrenIndices.length) {
        let prevIndex = orphanChildrenIndices.pop();
        let prevChild = prevChildren[prevIndex];
        prevChildren.splice(prevIndex, 1);
        prevChild.renderer.unmount();
      }

      // process add and insert
      let lastMarker;
      for (let i = 0; i < nextChildren.length; i++) {
        let nextChild = nextChildren[i];
        let prevIndex = prevKeyToIndex.get(nextChild.key);
        // is new, append to container
        if (prevIndex === void 0) {
          lastMarker = nextChild.marker = createMarker("item " + i);
          container.appendChild(nextChild.marker);
          mount(context, nextChild, nextChild.item);
        } else {
          let prevChild = prevChildren[prevIndex];
          if (prevIndex !== i) {
            prevChildren[prevIndex] = prevChildren[i];
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
          nextChildren[i] = prevChild;
          lastMarker = prevChild.marker;
        }
      }

      prevChildren = nextChildren;
    },
    unmount() {
      let i = prevChildren.length;
      while (i--) prevChildren[i].renderer.unmount();
    },
  };
}

/*

Nx P

 */
