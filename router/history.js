import createEmitter from "../core/createEmitter";
import createReadonlyProxy from "../core/createReadonlyProxy";
import { emptyObject } from "../core/util";

let loc;
let navigateEmitter = createEmitter().get("navigate");
let historyWrapper = {
  location: createReadonlyProxy(getLocation),
  get state() {
    return getLocation().state;
  },
  push(to, state) {
    redirect({ to, state });
  },
  replace(to, state) {
    redirect({ to, state, replace: true });
  },
  redirect,
  listen: navigateEmitter.on,
};

function handleUpdate() {
  loc = null;
  navigateEmitter.emit();
}

addEventListener("popstate", handleUpdate);

if (typeof history !== "undefined") {
  for (let methodName of ["pushState", "replaceState"]) {
    let originalMethod = history[methodName];
    history[methodName] = function () {
      let result = originalMethod.apply(this, arguments);
      handleUpdate();
      return result;
    };
  }
}

handleUpdate();

function getLocation() {
  if (!loc) {
    loc = {
      pathname: location.pathname || "/",
      search: location.search,
      state: history.state || emptyObject,
      action: history.action,
      hash: location.hash,
    };
  }
  return loc;
}

function redirect(options) {
  if (typeof options === "string") {
    options = { to: options, state: arguments[1] };
  }
  let { to, replace = false, state = null } = options || emptyObject;
  if (to === location.pathname) return;
  console.log(to, location.pathname, state);
  history[replace ? "replaceState" : "pushState"](state || emptyObject, "", to);
}

export default historyWrapper;
