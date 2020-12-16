export default function debounce(ms = 0, fn) {
  if (typeof ms === "function") return debounce(0, fn);
  let timeoutId;
  let token;
  return function () {
    clearTimeout(timeoutId);
    let args = arguments;
    let t = (token = Symbol());
    return !ms
      ? Promise.resolve().then(() => t === token && fn(...args))
      : new Promise(
          (resolve) =>
            (timeoutId = setTimeout(() => {
              t === token && resolve(fn.apply(null, args));
            }, ms))
        );
  };
}
