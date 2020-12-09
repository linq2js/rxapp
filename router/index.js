import history from "./history";

export { Router, useRouterContext } from "./Router";
export { default as Redirect } from "./Redirect";
export { default as link } from "./link";

const { redirect, location } = history;

export { history, redirect, location };
