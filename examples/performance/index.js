import { part, store } from "../../core";

const startTime = Date.now();
const runningInfoStore = store({
  numColorUpdates: 0,
  secondsRunning: 0,
});
const duration = 30000;
const numElements = 100;
const colorStore = store({});

const Cell = part(({ n }) => () => {
  return part`<div style="width: 30px; height: 30px; text-align: center; padding: 10px; float: left;" ${{
    style: { backgroundColor: colorStore[n] },
  }}>${n}</div>`;
});

const Matrix = part`<div id="matrix" style="width: 500px">${new Array(
  numElements
)
  .fill()
  .map((_, n) => Cell({ n, key: n }))}</div>`;

const Info = part(() => {
  return () => {
    const { numColorUpdates, secondsRunning } = runningInfoStore;
    const colorsPerSecond = Math.floor(numColorUpdates / secondsRunning);
    return part`
      <h1 style="font-weight: 100">${secondsRunning}</h1>
      <div>${numColorUpdates} colors</div>
      <div>${colorsPerSecond} colors per second</div>
  `;
  };
});

const App = part`
<div>
  <h1>RXAPP</h1>
  <div>
    ${Info}
    ${Matrix}
  </div>
</div>
`;

App.mount("#app");

let numColorUpdates = 0;
function setColor(n) {
  colorStore[n] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  numColorUpdates++;
  runningInfoStore.secondsRunning = (Date.now() - startTime) / 1000;
  runningInfoStore.numColorUpdates = numColorUpdates;
  if (Date.now() - startTime >= duration) {
    return;
  }
  setTimeout(() => setColor(n), 0);
}

for (let n = 0; n < numElements; n++) {
  setColor(n);
}
