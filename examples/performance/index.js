import { part } from "../../core";

const startTime = Date.now();
const duration = 30000;
const numElements = 100;
const colors = {};
let numColorUpdates = 0;
let secondsRunning = 0;
let secondsRunningBinding = () => secondsRunning;
let numColorUpdatesBinding = () => numColorUpdates;
let colorsPerSecondBinding = () => Math.floor(numColorUpdates / secondsRunning);

const createCell = (n) => {
  const cellStyle = () => ({
    key: colors[n],
    style: { backgroundColor: colors[n] },
  });
  return part.key(
    n
  )`<div style="width: 30px; height: 30px; text-align: center; padding: 10px; float: left;" ${cellStyle}>${n}</div>`;
};

const Matrix = part`<div id="matrix" style="width: 500px">${new Array(
  numElements
)
  .fill()
  .map((_, n) => createCell(n))}</div>`;

const Info = part`
  <h1 style="font-weight: 100">${secondsRunningBinding}</h1>
  <div>${numColorUpdatesBinding} colors</div>
  <div>${colorsPerSecondBinding} colors per second</div>
`;

const App = part`
<div>
  <h1>RXAPP</h1>
  <div>
    ${Info}
    ${Matrix}
  </div>
</div>
`;

let app = App.mount("#app");

function setColor(n) {
  colors[n] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  app.update();
  numColorUpdates++;
  secondsRunning = (Date.now() - startTime) / 1000;
  app.update();
  if (Date.now() - startTime >= duration) return;
  setTimeout(() => setColor(n), 0);
}

for (let n = 0; n < numElements; n++) {
  setColor(n);
}
