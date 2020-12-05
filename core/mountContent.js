import createComponentRenderer from "./createComponentRenderer";
import createHtmlRenderer from "./createHtmlRenderer";
import createListRenderer from "./createListRenderer";
import createTemplateRenderer from "./createTemplateRenderer";
import createTextRenderer from "./createTextRenderer";
import {
  componentType,
  templateType,
  textType,
  listType,
  rendererType,
  htmlType,
  contextType,
} from "./types";
import { isArray } from "./util";

export default function mountContent(context, data, content) {
  while (typeof content === "function") content = content();

  if (data.content === content) return;

  data.content = content;

  let type = !content
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

  if (!data.renderer) {
    data.renderer = (type === componentType
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
