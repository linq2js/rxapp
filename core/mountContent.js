import createComponentRenderer from "./createComponentRenderer";
import createHtmlRenderer from "./createHtmlRenderer";
import createListRenderer from "./createListRenderer";
import createReactiveRenderer from "./createReactiveRenderer";
import createTemplateRenderer from "./createTemplateRenderer";
import createTextRenderer from "./createTextRenderer";
import {
  componentType,
  templateType,
  textType,
  listType,
  rendererType,
  htmlType,
  reactiveType,
} from "./types";
import { isArray } from "./util";

export default function mountContent(context, data, content) {
  while (typeof content === "function" && content.type) content = content();

  if (data.content === content) return;

  let type =
    typeof content === "function"
      ? reactiveType
      : !content
      ? textType
      : isArray(content)
      ? listType
      : content.type || textType;

  if (type === rendererType) return content.render(mountContent, context, data);
  let renderer = data.renderer;
  if (renderer) {
    let shouldUnmount =
      renderer.type !== type ||
      (type === componentType && renderer.render !== content.render) ||
      (type === templateType && renderer.id !== content.id);
    if (shouldUnmount) {
      renderer.unmount();
      data.renderer = renderer = null;
    }
  }

  data.content = content;

  if (!renderer) {
    let factory;
    switch (type) {
      case reactiveType:
        factory = createReactiveRenderer;
        break;
      case componentType:
        factory = createComponentRenderer;
        break;
      case templateType:
        factory = createTemplateRenderer;
        break;
      case listType:
        factory = createListRenderer;
        break;
      case htmlType:
        factory = createHtmlRenderer;
        break;
      default:
        factory = createTextRenderer;
    }
    data.renderer = renderer = factory(
      mountContent,
      context,
      data.marker,
      content,
      data
    );
  }

  renderer.update && renderer.update(content);
}
