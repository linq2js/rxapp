import { part, store, Suspense } from "rxapp";

const Lazy1 = part(() => import("./lazy1"), { lazy: true });
const Lazy2 = part(() => import("./lazy2"), {
  lazy: true,
  fallback: "Loading...",
});

const App = part`
  ${Lazy1({ data: 1 })}
  <hr/>
  ${Lazy2({ data: 2 })}
`;

App.mount("#app");
