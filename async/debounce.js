export default function debounce(ms = 0, fn) {
  let timeoutId;
  return function () {
    clearTimeout(timeoutId);
    let args = arguments;
    return !ms
      ? Promise.resolve().then(() => fn(...args))
      : new Promise(
        (resolve) =>
          (timeoutId = setTimeout(() => {
            resolve(fn.apply(null, args));
          }, ms))
      );
  };
}
