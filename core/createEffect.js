import globalContext from "./globalContext";

export default function createEffect(effect) {
  globalContext.component.addEffect(effect);
}
