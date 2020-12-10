import createComponent from "./createComponent";
import createMemo from "./createMemo";

let Chunk = createComponent((props) => {
  let getGroups = createMemo((data = [], size = 50, render) => {
    let index = 0;
    let groups = [];
    while (index < data.length) {
      let items = data.slice(index, index + size);
      groups.push(Group(render(items, groups.length)));
      index += size;
    }
    return groups;
  });

  return () => getGroups(props.data, props.size, props.render);
});

let Group = createComponent((props) => props.content, { lazy: true });

export default Chunk;
