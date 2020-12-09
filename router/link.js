import history from "./history";

export default function link(options) {
  // <a ${link(to)}></a>
  if (typeof options === "string")
    options = { to: options, state: arguments[1] };
  // <a ${link(options)}></a>
  let { to, state, replace, onclick } = options || {};

  return {
    ref(node) {
      if (to && node.tagName === "A" && node.href !== to) node.href = to;
    },
    onclick(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0)
        return;
      e.preventDefault();
      history[replace ? "replace" : "push"](to || e.currentTarget.href, state);
      typeof onclick === "function" && onclick();
    },
  };
}
