// normally below is just:  import { Component, render, h } from 'preact';
let { Component, render, h, options } = preact; // tells Babel to convert JSX to h() calls

/** @jsx h */ // Preact lets you specify your own sync/debounce function.
// this is nice for animations, where rAF is best:
options.debounceRendering = requestAnimationFrame;
// options.syncComponentUpdates = false;

const COUNT = 200;
const LOOPS = 6;

class AnimationPicker extends Component {
  state = {
    timingFunction: "requestAnimationFrame",
  };

  IDLE_TIMEOUT = { timeout: 50 };

  timingFunctions = {
    "setImmediate/MessageChannel (default)": null, // default
    requestAnimationFrame: requestAnimationFrame,
    requestIdleCallback: (f) => requestIdleCallback(f, this.IDLE_TIMEOUT),
    "setTimeout(0)": (f) => setTimeout(f, 0),
    "setTimeout(100)": (f) => setTimeout(f, 100),
    Promise: (f) => Promise.resolve().then(f),
  };

  componentDidUpdate() {
    options.debounceRendering = this.timingFunctions[this.state.timingFunction];
  }

  noBubble(e) {
    e.stopPropagation();
  }

  render({}, { timingFunction }) {
    return (
      <label class="animation-picker" onMouseDown={this.noBubble}>
        Timing:
        <select
          value={timingFunction}
          onChange={linkState(this, "timingFunction")}
        >
          {Object.keys(this.timingFunctions).map((name) => (
            <option
              value={name}
              disabled={this.timingFunctions[name] === undefined}
            >
              {name}
            </option>
          ))}
        </select>
      </label>
    );
  }
}

/** This component controls the app itself.
 *	It wires up some global mouse events (this is uncommon).
 *	When component state changes, it gets re-rendered automatically.
 */
class Main extends Component {
  state = { x: 0, y: 0, big: false, counter: 0 };

  componentDidMount() {
    let touch = navigator.maxTouchPoints > 1;

    // set mouse position state on move:
    addEventListener(touch ? "touchmove" : "mousemove", (e) => {
      this.setMouse(e.touches ? e.touches[0] : e);
    });

    // holding the mouse down enables big mode:
    addEventListener(touch ? "touchstart" : "mousedown", (e) => {
      this.setBig(true);
      e.preventDefault();
    });
    addEventListener(touch ? "touchend" : "mouseup", (e) => this.setBig(false));

    this.increment();
  }

  componentDidUpdate() {
    // invoking setState() in componentDidUpdate() creates an animation loop:
    this.increment();
  }

  increment() {
    this.state.counter++; // avoids an object allocation
    this.setState();
  }

  setMouse({ pageX: x, pageY: y }) {
    this.setState({ x, y });
    return false;
  }

  setBig(big) {
    this.setState({ big });
  }

  // builds and returns a brand new DOM (every time)
  render(props, { x, y, big, counter }) {
    let max =
        COUNT +
        Math.round(Math.sin((counter / 90) * 2 * Math.PI) * COUNT * 0.5),
      cursors = [];

    // the advantage of JSX is that you can use the entirety of JS to "template":
    for (let i = max; i--; ) {
      let f = (i / max) * LOOPS,
        θ = f * 2 * Math.PI,
        m = 20 + i * 2,
        hue = (f * 255 + counter * 10) % 255;
      cursors[i] = (
        <Cursor
          big={big}
          color={"hsl(" + hue + ",100%,50%)"}
          x={(x + Math.sin(θ) * m) | 0}
          y={(y + Math.cos(θ) * m) | 0}
        />
      );
    }

    return (
      <div id="main">
        <AnimationPicker />
        <Cursor label x={x} y={y} big={big} />
        {cursors}
      </div>
    );
  }
}

/** Represents a single coloured dot. */
class Cursor extends Component {
  // skip any pointless re-renders
  shouldComponentUpdate(props) {
    for (let i in props)
      if (i !== "children" && props[i] !== this.props[i]) return true;
    return false;
  }

  // get shared/pooled class object
  getClass(big, label) {
    let cl = "cursor";
    if (big) cl += " big";
    if (label) cl += " label";
    return cl;
  }

  // first argument is "props", the attributes passed to <Cursor ...>
  render({ x, y, label, color, big }) {
    let inner = null;
    if (label)
      inner = (
        <span class="label">
          {x},{y}
        </span>
      );
    return (
      <div
        class={this.getClass(big, label)}
        style={{ left: x || 0, top: y || 0, borderColor: color }}
      >
        {inner}
      </div>
    );
  }
}

// Mount the top-level component to the DOM:
render(<Main />, document.body);

// Addendum: disable dragging on mobile
addEventListener("touchstart", (e) => (e.preventDefault(), false));

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
