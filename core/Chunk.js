import debounce from "../async/debounce";
import createComponent from "./createComponent";
import createMemo from "./createMemo";
import { getters } from "./util";

let Group = createComponent(
  (props) => () => props.render(props.items, props.index),
  {
    lazy: true,
  }
);

let Chunk = createComponent((props) => {
  let createChunks = createMemo((data = [], size = 25) => {
    let index = 0;
    let groups = [];
    let length = data.length;
    // let getKey = typeof key === "function" ? key : (item) => item[key];
    while (index < length) {
      let items = data.slice(index, index + size);
      let groupProps = {
        key: groups.length,
        render: props.render,
        index: groups.length,
        items,
      };
      groups.push(Group(groupProps));
      index += size;
    }
    return groups;
  });
  let render = () => createChunks(props.data, props.size);
  return props.debounce ? debounce(props.debounce, render) : render;
});

export default Chunk;
