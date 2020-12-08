import { part, store, select } from "../../core";

const selectedStore = store(0);
const dataStore = store([]);

const Button = part(
  ({ id, action, title }) => part`
  <div>
    <button type="button" class="btn btn-primary btn-block" ${{
      id,
      title,
      onclick: action,
    }}>${title}</button>
  </div>`
);

const Row = part((props) => {
  let id = props.item.id;
  let selectDirective = { onclick: () => selectRow(id) };
  let removeDirective = { onclick: () => remove(id) };
  let inputDirective = { oninput: (e) => update(id, e.target.value) };

  return () => {
    let { item } = props;
    let isSelected = select(selectedStore, (value) => value === id);
    return part`
  <tr ${{ style: isSelected && "font-weight: bold" }}>
    <td class="td-id col-md-1">${id}</td>
      <td class="col-md-4" style="max-width: 200px">
        <input type="text" ${inputDirective} ${{ value: item.label }}/>
        <div style="overflow-wrap: anywhere">
          <a class="select" ${selectDirective}>
            ${item.label}
          </a>
        </div>
      </td>
      <td class="col-md-1">
        <button class="remove" ${removeDirective}>remove</button>
      </td>
      <td class="col-md-6"></td>
  </tr>
  `;
  };
});

const Table = part(() => () => {
  return part`
  <table class="table table-hover table-striped test-data">
    <tbody id="tbody">
      ${select(dataStore).map((item) => Row({ item, key: item.id }))}
    </tbody>
  </table>
  `;
});

const ComponentWithChildren = part(
  ({ name = "No name", children }) => part`<div>${name}: ${children}</div>`
);

const App = part`
  ${ComponentWithChildren}
  ${ComponentWithChildren`Template as children`}
  ${ComponentWithChildren({ name: "No child" })}
  ${ComponentWithChildren({
    name: "Template as children",
  })`<strong>This is template</strong>`}
  ${ComponentWithChildren({ name: "Prop as children", children: "Children" })}
  
  <div>
    <div class="jumbotron">
    <div class="row">
      <div class="col-md-6"><h1>RXAPP</h1></div>
      <div class="col-md-6">
        <div class="row">
          ${Button({
            id: "run1k",
            title: "Create 1,000 rows",
            action: () => run(1000),
          })}
          ${Button({
            id: "run2k",
            title: "Create 2,000 rows",
            action: () => run(2000),
          })}
          ${Button({
            id: "run3k",
            title: "Create 3,000 rows",
            action: () => run(3000),
          })}
          ${Button({
            id: "run4k",
            title: "Create 4,000 rows",
            action: () => run(4000),
          })}
          ${Button({
            id: "run5k",
            title: "Create 5,000 rows",
            action: () => run(5000),
          })}
          ${Button({
            id: "run10k",
            title: "Create 10,000 rows",
            action: () => run(10000),
          })}
          ${Button({ id: "add", title: "Append 1,000 rows", action: add })}
          ${Button({
            id: "update",
            title: "Update every 10th row",
            action: update,
          })}
          ${Button({ id: "clear", title: "Clear", action: clear })}
          ${Button({ id: "swaprows", title: "Swap Rows", action: swapRows })}
        </div>
      </div>
    </div>
  </div>

  ${Table}`;

App.mount("#app");

function performanceTest(name, callback) {
  const start = Date.now();
  const end = () =>
    setTimeout(() => {
      const elapsed = Date.now() - start;
      console.log(name, elapsed);
    });

  if (callback) {
    const result = callback();
    end();
    return result;
  }
  return end;
}

function run(num) {
  return performanceTest("run" + num, () => {
    dataStore.state = buildData(num);
    selectedStore.state = 0;
  });
}

function add() {
  return performanceTest("add", () =>
    dataStore.reduce((value) => value.concat(buildData(1000)))
  );
}

function update(id, label) {
  return performanceTest("update", () =>
    id
      ? dataStore.reduce((data) =>
          data.map((item) => (item.id === id ? { ...item, label } : item))
        )
      : dataStore.reduce((data) =>
          data.map((item, i) =>
            i % 10 === 0 ? { ...item, label: item.label + "!!!" } : item
          )
        )
  );
}

function selectRow(id) {
  return performanceTest("selectRow", () => (selectedStore.state = id));
}

function remove(id) {
  return performanceTest("remove", () =>
    dataStore.reduce((value) => value.filter((x) => x.id !== id))
  );
}

function clear() {
  return performanceTest("clear", () => {
    dataStore.state = [];
    selectedStore.state = 0;
  });
}

function swapRows() {
  return performanceTest("swap", () => {
    dataStore.reduce((data) => {
      if (data.length > 2) {
        const newData = data.slice();
        let temp = newData[1];
        newData[1] = newData[data.length - 1];
        newData[data.length - 1] = temp;
        return newData;
      }
      return data;
    });
  });
}

function random(max) {
  return Math.round(Math.random() * 1000) % max;
}

const A = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];
const C = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];
const N = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

let nextId = 1;

function buildData(count) {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: "item-" + nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }
  return data;
}
