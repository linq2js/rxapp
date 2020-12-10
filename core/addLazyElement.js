import createEmitter from "./createEmitter";
import { doc } from "./util";

let onScrollListenerAdded = false;
let scrollEmitter = createEmitter().get("scroll");

export default function addLazyElement(element, update) {
  if (!onScrollListenerAdded) {
    onScrollListenerAdded = true;
    addEventListener("scroll", scrollEmitter.emit);
  }
  let unsubscribe;
  function wrapper() {
    if (elementInViewport(element)) {
      unsubscribe && unsubscribe();
      update();
      return true;
    }
  }

  if (wrapper()) return;
  return (unsubscribe = scrollEmitter.on(wrapper));
}

function elementInViewport(element) {
  if (!element.previousElementSibling) return true;
  element = element.previousElementSibling;
  let top = element.offsetTop;
  let left = element.offsetLeft;
  let width = element.offsetWidth;
  let height = element.offsetHeight;

  while (element.offsetParent) {
    element = element.offsetParent;
    top += element.offsetTop;
    left += element.offsetLeft;
  }

  return (
    top < window.pageYOffset + window.innerHeight &&
    left < window.pageXOffset + window.innerWidth &&
    top + height > window.pageYOffset &&
    left + width > window.pageXOffset
  );
}
