export default function debounce(fn, ms = 0) {
  let timeoutId;
  return function () {
    clearTimeout(timeoutId);
    let args = arguments;
    return new Promise(
      (resolve) =>
        (timeoutId = setTimeout(() => {
          resolve(fn.apply(null, args));
        }, ms))
    );
  };
}
