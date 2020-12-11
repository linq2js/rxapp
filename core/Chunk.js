import createComponent from "./createComponent";
import createMemo from "./createMemo";

let Group = createComponent(
  (props) => () => props.render(props.items, props.index),
  {
    lazy: true,
  }
);

let Chunk = createComponent((props) => {
  let createChunks = createMemo((data = [], size = 100) => {
    let index = 0;
    let groups = [];
    // let getKey = typeof key === "function" ? key : (item) => item[key];
    while (index < data.length) {
      let items = data.slice(index, index + size);
      groups.push(
        Group({
          key: groups.length,
          render: props.render,
          index: groups.length,
          items,
        })
      );
      index += size;
    }
    return groups;
  });

  return () => createChunks(props.data, props.size);
});

export default Chunk;
