import arrayEqual from "./arrayEqual";
import { emptyArray, invokeAll } from "./util";

export default function createEffectManager(component, context) {
  let effects = [];

  function add(effect, deps) {
    if (component.mounted)
      throw new Error("Cannot add effect after the component mounted");
    effects.push({ effect, deps });
  }

  function run() {
    if (component.unmounted) return;
    for (let i = 0; i < effects.length; i++) {
      let data = effects[i];
      let currentDeps = data.deps
        ? data.deps(context)
        : data.deps === null || data.deps === void 0
        ? emptyArray
        : data.deps;
      if (!currentDeps || !arrayEqual(currentDeps, data.prevDeps)) {
        data.prevDeps = currentDeps;
        data.dispose && data.dispose();
        data.dispose = data.effect(context);
      }
    }
  }

  function dispose() {
    invokeAll(effects, undefined, "dispose");
  }

  component.effect = add;

  return { add, run, dispose };
}
