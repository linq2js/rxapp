import { part, memo } from "../../core";

let selected = 0;
let data = [];

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
  let selectDirective = { onclick: () => selectRow(props.item.id) };
  let removeDirective = { onclick: () => remove(props.item.id) };
  let selectedBinding = () => ({
    style: props.item.id === selected && "font-weight: bold",
  });

  return part`
  <tr ${selectedBinding}>
    <td class="td-id col-md-1">${props.item.id}</td>
      <td class="col-md-4">
        <a class="select" ${selectDirective}>${() => props.item.label}</a>
      </td>
      <td class="col-md-1">
        <button class="remove" ${removeDirective}>remove</button>
      </td>
      <td class="col-md-6"></td>
  </tr>
  `;
});

const Table = part(() => {
  let getRows = memo((rows) => rows.map((item) => Row({ item, key: item.id })));
  return part`
  <table class="table table-hover table-striped test-data">
    <tbody id="tbody">
      ${() => getRows(data)}
    </tbody>
  </table>
  `;
});

const App = part`
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
            action: () => update(),
          })}
          ${Button({ id: "clear", title: "Clear", action: clear })}
          ${Button({ id: "swaprows", title: "Swap Rows", action: swapRows })}
        </div>
      </div>
    </div>
  </div>

  ${Table}`;

App.mount("#app");
let performanceLogElement = document.createTextNode("");
document.body.insertBefore(performanceLogElement, document.body.firstChild);
function performanceTest(name, callback) {
  const start = Date.now();
  const end = () =>
    setTimeout(() => {
      const elapsed = Date.now() - start;
      performanceLogElement.nodeValue = `${name}: ${elapsed}`;
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
    selected = 0;
    data = buildData(num);
  });
}

function add() {
  return performanceTest("add", () => (data = data.concat(buildData(1000))));
}

function update(item, label) {
  return performanceTest("update", () => {
    if (item) {
      item.label += "!!!";
    } else {
      data.forEach((item, index) => index % 10 === 0 && (item.label += "!!!"));
    }
  });
}

function selectRow(id) {
  return performanceTest("selectRow", () => (selected = id));
}

function remove(id) {
  return performanceTest(
    "remove",
    () => (data = data.filter((x) => x.id !== id))
  );
}

function clear() {
  return performanceTest("clear", () => {
    selected = 0;
    data = [];
  });
}

function swapRows() {
  return performanceTest("swap", () => {
    data = ((data) => {
      if (data.length > 2) {
        const newData = data.slice();
        let temp = newData[1];
        newData[1] = newData[data.length - 1];
        newData[data.length - 1] = temp;
        return newData;
      }
      return data;
    })(data);
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
