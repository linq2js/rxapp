export default function isMarker(node) {
  return node.nodeType === 3 || node.nodeType === 8;
}
