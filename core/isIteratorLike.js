export default function isIteratorLike(value) {
  return value && typeof value.then === "function";
}
