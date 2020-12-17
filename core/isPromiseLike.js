export default function isPromiseLike(value) {
  return value && value.then;
}
