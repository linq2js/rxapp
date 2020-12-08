import { context, effect, memo, part } from "./index";

const component = part<{ name: string }>((props) => {
  let name = props.name;
  console.log(name);
  effect(() => {
    return () => console.log(11);
  });
  effect(
    () => {},
    () => [1, 2, 3]
  );
  return "";
});
component.mount();

const template = part`<h1></h1>`;

template.mount();

const memoizedFn = memo((a, b) => [1, 2, 3]);
memoizedFn(1, 2).push(1);

const [Provider, consume] = context(100);

Provider();
Provider({ value: 100 });
console.log(consume().current);
