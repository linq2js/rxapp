export default function isIteratorLike(value) {
  return value && value.next && value.next.call;
}
