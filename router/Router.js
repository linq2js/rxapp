import { effect, memo } from "../core/index";
import createComponent from "../core/createComponent";
import createContext from "../core/createContext";
import { emptyObject, isComponent, isTemplate } from "../core/util";
import createMatcher from "./createMatcher";
import history from "./history";

let [RouterProvider, useRouterContext] = createContext();
let anythingGroupName = "__anything__";
let endWithAnything = /\*\*$/;
let anythingMatch = `/:${anythingGroupName}*`;

let Router = createComponent((props, { update }) => {
  let routerContext = useRouterContext();
  let matcher = createMatcher();
  let location = history.location;

  function matchRoute(pattern) {
    return matcher(pattern, location.pathname);
  }

  effect(() => history.listen(update));

  return memo(
    () => ({
      pathname: location.pathname,
      state: location.state,
      routes: props.routes,
    }),
    ({ routes, pathname }) => {
      let fallback;
      let parentMatch = routes.nested ? routerContext.current.match : undefined;
      let matched;
      for (let key in routes) {
        if (key === "nested") continue;
        let route = routes[key];
        if (isComponent(route) || isTemplate(route)) route = { render: route };
        if (key === "_") {
          fallback = route;
          continue;
        }

        let paths = (route.paths || []).concat(key);
        if (parentMatch)
          paths = paths.map((path) => parentMatch.add.path(path));
        for (let i = 0; i < paths.length; i++) {
          let path = paths[i];
          let [success, params] = matcher(
            endWithAnything.test(path)
              ? path.substr(0, path.length - 2) + anythingMatch
              : path,
            pathname
          );
          if (success) {
            matched = createMatch(pathname, path, params);
            matched.route = route;
            break;
          }
        }
        if (matched) break;
      }
      let componentProps, renderComponent;
      if (!matched) {
        // nothing to render
        if (!fallback) return;
        if (fallback.to) return history.redirect(fallback);
        componentProps = {
          match: createMatch(pathname),
        };
        renderComponent = fallback.render;
      } else {
        componentProps = {
          match: matched,
        };
        renderComponent = matched.route.render;
      }
      if (!renderComponent) return;

      return RouterProvider({
        value: { match: componentProps.match, matcher, getRoute: matchRoute },
        children: renderComponent(componentProps),
      });
    }
  );
});

function appendUrl(url = "", subUrl = "") {
  return (
    url +
    (url[url.length - 1] === "/" ? "" : "/") +
    (subUrl[0] === "/" ? subUrl.substr(1) : subUrl)
  );
}

function createMatch(url, path, params = emptyObject) {
  let anythingWildcard = endWithAnything.test(path);
  if (anythingWildcard) path = path.substr(0, path.length - 2);
  if (anythingWildcard && params[anythingGroupName]) {
    url = url.substr(0, url.length - params[anythingGroupName].length);
  }
  return {
    path,
    params,
    url,
    add: {
      path: (subPath) => appendUrl(path, subPath),
      url: (subUrl) => appendUrl(url, subUrl),
    },
  };
}

export { Router, useRouterContext };
