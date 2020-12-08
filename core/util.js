export let emptyObject = {};
export let emptyArray = [];
export let noop = () => {};
export let unset = {};
export let isArray = Array.isArray;
export let assign = Object.assign;
export let slice = emptyArray.slice;
export let indexOf = emptyArray.indexOf;
export let doc = typeof document === "undefined" ? null : document;
export function invokeAll(funcs, payload, prop) {
  for (let i = 0; i < funcs.length; i++) {
    let func = prop ? funcs[i][prop] : funcs[i];
    if (!func) continue;
    func(payload);
  }
}
