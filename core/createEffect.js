import gc from "./globalContext";

export default function createEffect(effect, deps) {
  gc.component.effect(effect, deps);
}
