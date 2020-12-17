import { part, memo, keyed } from "../../core";

const Layout = {
  PHYLLOTAXIS: 0,
  GRID: 1,
  WAVE: 2,
  SPIRAL: 3,
};

const LAYOUT_ORDER = [
  Layout.PHYLLOTAXIS,
  Layout.SPIRAL,
  Layout.PHYLLOTAXIS,
  Layout.GRID,
  Layout.WAVE,
];

const theta = Math.PI * (3 - Math.sqrt(5));
let numPoints = 1000;
let step = 0;
let layout = 0;
let numSteps = 60 * 2;
let async = false;
let points = makePoints();

const Controls = () => {
  let onChange$ = { onchange: handleUIUpdate };
  let numPoints$ = () => ({ value: numPoints });
  let async$ = () => ({ checked: async });

  return part`
  <div class="controls">
    # Points
    <input name="numPoints" type="range" min=10 max=10000 ${numPoints$} ${onChange$}>
    ${() => numPoints}
    <label>
      <input name="async" type="checkbox" ${async$} ${onChange$}>
      Async
    </label>
  </div>
  `;
};

const createRect = (point) => {
  const fill$ = { "@fill": point.color };
  const transform$ = () => {
    let transform = `translate(${point.x}, ${point.y})`;
    return { "@transform": transform };
  };
  return part`<rect class="point" ${fill$} ${transform$}/>`;
};

const Canvas = () => {
  return part`
  <svg class="demo">
    <g>${() =>
      points.map((point, index) => keyed(index, createRect(point)))}</g>
  </svg>`;
};

const App = part`
<div class="app-wrapper">
  ${Canvas()}
  ${Controls()}
  <div class="about">
    based on the Preact demo by <a href="https://github.com/developit" target="_blank">Jason Miller</a>,
    based on the Glimmer demo by <a href="http://mlange.io" target="_blank">Michael Lange</a>.
  </div>
</div>`;

// components

//actions
function handleUIUpdate(e) {
  switch (e.target.name) {
    case "async":
      async = e.target.checked;
      break;
    case "numPoints":
      numPoints = parseInt(e.target.value, 10);
      points = makePoints();
      break;
    default:
  }

  app.update();
}

// utilities

function makePoints() {
  let phyllotaxis = genPhyllotaxis(numPoints);
  let grid = genGrid(numPoints);
  let wave = genWave(numPoints);
  let spiral = genSpiral(numPoints);
  let anchors = { phyllotaxis, grid, wave, spiral };

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push(
      setAnchors(
        {
          x: 0,
          y: 0,
          color: d3.interpolateViridis(i / numPoints),
        },
        i,
        anchors
      )
    );
  }
  return points;
}

function next() {
  step = (step + 1) % numSteps;

  if (step === 0) {
    layout = (layout + 1) % LAYOUT_ORDER.length;
  }

  // Clamp the linear interpolation at 80% for a pause at each finished layout state
  const pct = Math.min(1, step / (numSteps * 0.8));

  const currentLayout = LAYOUT_ORDER[layout];
  const nextLayout = LAYOUT_ORDER[(layout + 1) % LAYOUT_ORDER.length];

  // Keep these redundant computations out of the loop
  const pxProp = xForLayout(currentLayout);
  const nxProp = xForLayout(nextLayout);
  const pyProp = yForLayout(currentLayout);
  const nyProp = yForLayout(nextLayout);

  points.forEach((point) => {
    point.x = lerp(point, pct, pxProp, nxProp) || 0;
    point.y = lerp(point, pct, pyProp, nyProp) || 0;
  });

  app.update();
  requestAnimationFrame(next);
}

function setAnchors(p, index, { grid, wave, spiral, phyllotaxis }) {
  const [gx, gy] = project(grid(index));
  const [wx, wy] = project(wave(index));
  const [sx, sy] = project(spiral(index));
  const [px, py] = project(phyllotaxis(index));
  Object.assign(p, { gx, gy, wx, wy, sx, sy, px, py });
  return p;
}

function xForLayout(layout) {
  switch (layout) {
    case Layout.PHYLLOTAXIS:
      return "px";
    case Layout.GRID:
      return "gx";
    case Layout.WAVE:
      return "wx";
    case Layout.SPIRAL:
      return "sx";
  }
}

function yForLayout(layout) {
  switch (layout) {
    case Layout.PHYLLOTAXIS:
      return "py";
    case Layout.GRID:
      return "gy";
    case Layout.WAVE:
      return "wy";
    case Layout.SPIRAL:
      return "sy";
  }
}

function lerp(obj, percent, startProp, endProp) {
  let px = obj[startProp];
  return px + (obj[endProp] - px) * percent;
}

function genPhyllotaxis(n) {
  return (i) => {
    let r = Math.sqrt(i / n);
    let th = i * theta;
    return [r * Math.cos(th), r * Math.sin(th)];
  };
}

function genGrid(n) {
  let rowLength = Math.round(Math.sqrt(n));
  return (i) => [
    -0.8 + (1.6 / rowLength) * (i % rowLength),
    -0.8 + (1.6 / rowLength) * Math.floor(i / rowLength),
  ];
}

function genWave(n) {
  let xScale = 2 / (n - 1);
  return (i) => {
    let x = -1 + i * xScale;
    return [x, Math.sin(x * Math.PI * 3) * 0.3];
  };
}

function genSpiral(n) {
  return (i) => {
    let t = Math.sqrt(i / (n - 1)),
      phi = t * Math.PI * 10;
    return [t * Math.cos(phi), t * Math.sin(phi)];
  };
}

function scale(magnitude, vector) {
  return vector.map((p) => p * magnitude);
}

function translate(translation, vector) {
  return vector.map((p, i) => p + translation[i]);
}

function project(vector) {
  const wh = window.innerHeight / 2;
  const ww = window.innerWidth / 2;
  return translate([ww, wh], scale(Math.min(wh, ww), vector));
}

const app = App.mount({
  container: "#app",
});

next();

(function () {
  var script = document.createElement("script");
  script.onload = function () {
    var stats = new Stats();
    document.body.appendChild(stats.dom);
    requestAnimationFrame(function loop() {
      stats.update();
      requestAnimationFrame(loop);
    });
  };
  script.src = "//cdn.jsdelivr.net/gh/Kevnz/stats.js/build/stats.min.js";
  document.head.appendChild(script);
})();
