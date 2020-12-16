import { doc } from "./util";

export default function createMarker(name) {
  return doc.createComment(name || "");
  return doc.createTextNode("");
}
