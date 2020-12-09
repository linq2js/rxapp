import core from "./coreExports";
import router from "./routerExports";
import async from "./asyncExports";

export default {
  ...core,
  ...async,
  ...router,
};
