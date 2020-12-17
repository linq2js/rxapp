import { isArray } from "./util";

export default function arrayEqual(a, b, comparer) {
  if (isArray(a) && isArray(b) && a.length === b.length) {
    let i = a.length;
    if (comparer) {
      if (a.some((av, i) => !comparer(av, b[i]))) return false;
    } else {
      if (a.some((av, i) => av !== b[i])) return false;
    }
    return true;
  }
  return false;
}
