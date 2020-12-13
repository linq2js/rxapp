import createEmitter from "../core/createEmitter";
import { assign, emptyObject } from "../core/util";

let navigateEmitter = createEmitter().get("navigate");
let currentLocation = {};
let historyWrapper = {
  location: currentLocation,
  get state() {
    return currentLocation.state;
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
  assign(currentLocation, {
    pathname: location.pathname || "/",
    search: location.search,
    state: history.state || emptyObject,
    action: history.action,
    hash: location.hash,
  });
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
