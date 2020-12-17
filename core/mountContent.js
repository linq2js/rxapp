import createHtmlRenderer from "./createHtmlRenderer";
import createListRenderer from "./createListRenderer";
import createTemplateRenderer from "./createTemplateRenderer";
import createTextRenderer from "./createTextRenderer";
import {
  templateType,
  textType,
  listType,
  rendererType,
  htmlType,
  keyedType,
} from "./types";
import { isArray } from "./util";

export default function mountContent(context, data, content) {
  while (content && content.call && !content.type) content = content();

  if (data.content === content) return;

  if (content && content.type === keyedType) content = content.content;

  let type = !content
    ? textType
    : isArray(content)
    ? listType
    : content.type || textType;

  if (type === rendererType) return content.render(mountContent, context, data);
  let renderer = data.renderer;
  if (renderer) {
    let shouldUnmount =
      renderer.type !== type ||
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
