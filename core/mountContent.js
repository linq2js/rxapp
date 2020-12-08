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
  if (data.renderer) {
    let shouldUnmount =
      data.renderer.type !== type ||
      (type === componentType && data.renderer.render !== content.render) ||
      (type === templateType && data.renderer.id !== content.id);
    if (shouldUnmount) {
      data.renderer.unmount();
      data.renderer = null;
    }
  }

  data.content = content;

  if (!data.renderer) {
    data.renderer = (type === reactiveType
      ? createReactiveRenderer
      : type === componentType
      ? createComponentRenderer
      : type === templateType
      ? createTemplateRenderer
      : type === listType
      ? createListRenderer
      : type === htmlType
      ? createHtmlRenderer
      : createTextRenderer)(mountContent, context, data.marker, content, data);
  }

  data.renderer.update && data.renderer.update(content);
}
