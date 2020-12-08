import { effect, part } from "../../core";
import { Suspense, lazy, delay, loadable } from "../../async";

let count = 0;
const AsyncData1 = loadable(delay(1000, "Async Data Loaded"));

const Lazy1 = lazy(() =>
  import("./lazy1").then((result) => delay(1000, result))
);
const Lazy2 = lazy(() =>
  import("./lazy2").then((result) => delay(1000, result))
);

const Effect1 = part(() => {
  effect(() => {
    console.log("mount 1");
    return () => console.log("unmount 1");
  });
  return 'Effect';
});

const App = part`
  ${Suspense({ fallback: "Loading 1...", children: Lazy1({ data: 1 }) })}
  <hr/>
  ${Suspense({ fallback: "Loading 2..." })`
    <h2>Lazy 2</h2>
    ${Lazy2({ data: 2 })}
  `}
  ${Suspense({
    fallback: "Loading...",
    children: AsyncData1,
  })}
  <h1>${() => count}</h1>
  <button ${{ onclick: () => count++ }}>Increase</button>
  ${() => count % 2 === 0 && Effect1}
`;

App.mount("#app");
