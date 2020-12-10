import { part } from "../../core";

let Box = part(
  () =>
    part`<div style="border: 5px solid red; height: 300px; width: 200px; background: silver"></div>`,
  { lazy: true }
);

part`${new Array(100).fill(0).map(() => Box)}`.mount();
