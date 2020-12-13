import gc from "./globalContext";

export default function createHandle(handle) {
  gc.component.handle = handle;
}
