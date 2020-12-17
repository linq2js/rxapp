import { keyedType } from "./types";

export default function keyed(key, content) {
  return { key, content, type: keyedType };
}
