import { componentType, templateType } from "./types";

export let emptyObject = {};
export let emptyArray = [];
export let noop = () => {};
export let unset = {};
export let isArray = Array.isArray;
export let assign = Object.assign;
export let slice = emptyArray.slice;
export let indexOf = emptyArray.indexOf;
export let defProp = Object.defineProperty;
export let doc = typeof document === "undefined" ? null : document;
export function invokeAll(funcs, payload, prop) {
  for (let i = 0; i < funcs.length; i++) {
    let func = prop ? funcs[i][prop] : funcs[i];
    if (!func) continue;
    func(payload);
  }
}

export function isComponent(value) {
  return value && value.type === componentType;
}

export function isTemplate(value) {
  return value && value.type === templateType;
}

export function getters(obj, getters) {
  for (let key in getters) {
    defProp(obj, key, { get: getters[key] });
  }
  return obj;
}

export let microEnqueue = Promise.resolve().then.bind(Promise.resolve());
export let rafEnqueue =
  typeof requestAnimationFrame === "undefined"
    ? microEnqueue
    : requestAnimationFrame;
let internalEnqueue = microEnqueue;

export function enqueue(f, raf) {
  return raf ? rafEnqueue(f) : internalEnqueue(f);
}
