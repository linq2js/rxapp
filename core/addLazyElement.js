import createEmitter from "./createEmitter";

let onScrollListenerAdded = false;
let scrollEmitter = createEmitter().get("scroll");

export default function addLazyElement(element, update) {
  if (!onScrollListenerAdded) {
    onScrollListenerAdded = true;
    addEventListener("scroll", scrollEmitter.emit, true);
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
    let {
      scrollTop,
      scrollLeft,
      clientWidth,
      clientHeight,
      scrollHeight,
      scrollWidth,
    } = element.parentNode;
    let isOverflown = scrollHeight > clientHeight || scrollWidth > clientWidth;
    if (isOverflown) {
      if (
        contains(
          scrollLeft,
          scrollTop,
          clientWidth,
          clientHeight,
          left,
          top,
          width,
          height
        )
      )
        return true;
    }
    element = element.offsetParent;
    top += element.offsetTop;
    left += element.offsetLeft;
  }
  return contains(
    window.pageXOffset,
    window.pageYOffset,
    window.innerWidth,
    window.innerHeight,
    left,
    top,
    width,
    height
  );
}

function contains(
  viewX,
  viewY,
  viewWidth,
  viewHeight,

  left,
  top,
  width,
  height
) {
  return (
    top < viewY + viewHeight &&
    left < viewX + viewWidth &&
    top + height > viewY &&
    left + width > viewX
  );
}
