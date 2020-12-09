import { memo, part } from "../../core";
import "./styles.css";

let barCount = 0;
let barWidth = 0;
let count = 0;
let step = 1;
let active = true;

const createBar = (bar) => {
  const barBinding = () => {
    const translateY = Math.sin(count / 10 + bar / 20) * 100 * 0.5;
    const hue = ((360 / barCount) * bar - count) % 360;
    const color = "hsl(" + hue + ",95%,55%)";
    const rotation = (count + bar) % 360;
    const barX = barWidth * bar;
    const style = {
      width: barWidth + "%",
      left: barX + "%",
      transform:
        "scale(0.8,.5) translateY(" +
        translateY +
        "%) rotate(" +
        rotation +
        "deg)",
      backgroundColor: color,
    };
    return { style };
  };

  return part`<div class="bar" ${barBinding}></div>`;
};

const createBars = memo((barCount) =>
  new Array(barCount).fill().map((_, bar) => createBar(bar))
);

const App = part`
  <div ${{ onclick: () => (step *= -1) }}>
    <header>
      <h1 class="heading title">
        <a name="silky-smooth" class="anchor" href="#silky-smooth">
          <span class="header-link"></span></a>Super Silky <strong>smooth</strong>
      </h1>
      <p>Fast enough to power animations at 60FPS</p>
      <p>Compare to <a href="https://markojs.com/#silky-smooth">MarkoJs</a> and <a href="https://codepen.io/WebReflection/pen/rzQPpv?editors=0010">HyperHTML</a></p>
    </header>
    <div class="animated-sin-wave">
      ${() => createBars(barCount)}
    </div>
    <p class="animated-sin-wave-description">
      The above animation is ${() => barCount} <code>&lt;div&gt;</code> tags.
      No SVG, no CSS transitions/animations.
      It's all powered by rxapp which update each wave style every frame.
    </p>
  </div>
  `;

const app = App.mount("#app");

function updateBarCount() {
  barCount = Math.floor(window.innerWidth / 3);
  barWidth = 100 / barCount;
}

function updateCount() {
  count += step;
}

function nextFrame() {
  if (active) {
    app.dispatch(updateCount);
    requestAnimationFrame(nextFrame);
  }
}

window.addEventListener("resize", () => {
  app.dispatch(updateBarCount);
});

app.dispatch(updateBarCount);

setTimeout(nextFrame);

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
