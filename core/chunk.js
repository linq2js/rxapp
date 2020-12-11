import createComponent from "./createComponent";
import createMemo from "./createMemo";
import { emptyObject } from "./util";

let Group = createComponent(
  (props) => () => props.render(props.items, props.index),
  {
    lazy: true,
  }
);

export default function chunk({ size = 100, render } = emptyObject) {
  return createMemo((data = []) => {
    let index = 0;
    let groups = [];
    // let getKey = typeof key === "function" ? key : (item) => item[key];
    while (index < data.length) {
      let items = data.slice(index, index + size);
      groups.push(
        Group({
          key: groups.length,
          render,
          index: groups.length,
          items,
        })
      );
      index += size;
    }
    return groups;
  });
}
