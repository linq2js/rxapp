import gc from "./globalContext";

export default function createEffect(effect, deps) {
  gc.component.addEffect(effect, deps);
}
