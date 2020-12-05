import { rendererType } from "./types";

export default function createCustomRenderer(render) {
  return {
    type: rendererType,
    render,
  };
}
