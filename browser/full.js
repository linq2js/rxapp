import core from "./coreExports";
import router from "./routerExports";
import async from "./asyncExports";
import styled from "./styledExports";

export default {
  ...core,
  ...async,
  ...router,
  ...styled,
};
