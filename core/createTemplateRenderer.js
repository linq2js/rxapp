import createMarker from "./createMarker";
import { createReactiveHandler } from "./createReactiveHandler";
import isEqual from "./isEqual";
import patchNode from "./patchNode";
import { directiveType, templateType, placeholderType } from "./types";
import { doc, emptyArray, indexOf, unset } from "./util";

let templateTagName = "template";
let slotAttributeName = "hta-slot";
let slotToken = "@@hta";
let templatePattern = /(?:<\/?[^\s>]+|@@hta|>)/g;
let cache = [];

export default function createTemplateRenderer(
  mount,
  context,
  marker,
  { strings, id }
) {
  let template = cache[id];
  if (!template) {
    let { html, query, slots } = parseTemplate(strings);
    template = renderTemplate(marker, html, query, slots);
    cache[id] = template;
  }
  let nodes;
  let nodeGroup = context.removedNodes && context.removedNodes.get(id);
  if (nodeGroup && nodeGroup.length) {
    nodes = nodeGroup.pop();
  } else {
    nodes = template.childNodes.map((node) => node.cloneNode(true));
  }
  marker.before(...nodes);
  let bindings = [];
  let i = template.attachedNodes.length;
  let rootNode = { childNodes: nodes };
  let unmounted = false;

  while (i--) {
    let attachedNode = template.attachedNodes[i];
    let node = attachedNode.path.reduce(
      (parent, index) => parent.childNodes[index],
      rootNode
    );
    for (let j = 0; j < attachedNode.bindings.length; j++) {
      let b = attachedNode.bindings[j];
      let binding = {
        unsubscribe: null,
        prev: unset,
        marker: node,
        type: b.type,
        index: b.index,
        props: {},
      };
      bindings.unshift(binding);
    }
  }

  function bind(template) {
    let i = bindings.length;
    while (i--) {
      let binding = bindings[i];
      binding.prev = binding.value;
      binding.value = template.values[binding.index];
    }
  }

  function updateBinding(binding, value) {
    if (unmounted) return;
    let nextKey = value ? value.key : undefined;
    if (nextKey !== void 0) {
      // do nothing if binding has the same previous key
      if (isEqual(binding.key, nextKey)) return;
      binding.key = nextKey;
      if (value.bind) value = value.bind(nextKey);
    }

    if (binding.type === directiveType) {
      patchNode(context, binding, binding.marker, value);
    } else {
      mount(context, binding, value);
    }
  }

  return {
    id,
    type: templateType,
    reorder() {
      marker.before(...nodes);
    },
    update(template) {
      bind(template);
      let i = bindings.length;
      while (i--) {
        let binding = bindings[i];
        if (binding.prev === binding.value) continue;
        if (typeof binding.value === "function") {
          if (!binding.reactiveHandler) {
            binding.reactiveHandler = createReactiveHandler(
              (result) => {
                if (binding.updateToken === context.updateToken) return;
                binding.updateToken = context.updateToken;
                updateBinding(binding, result);
              },
              binding,
              context
            );
            binding.reactiveBinding = () =>
              binding.reactiveHandler(binding.value);
            binding.unsubscribe = context.addBinding(binding.reactiveBinding);
          }
          binding.reactiveBinding();
        } else {
          if (binding.unsubscribe) {
            binding.unsubscribe();
            binding.unsubscribe = null;
          }
          updateBinding(binding, binding.value);
        }
      }
    },
    unmount() {
      if (unmounted) return;
      unmounted = true;
      let i = bindings.length;
      while (i--) {
        let binding = bindings[i];
        binding.unsubscribe && binding.unsubscribe();
        binding.renderer && binding.renderer.unmount();
        if (binding.type === directiveType) {
          let node = binding.marker;
          let data = node.$$data;
          let eventCache = data && data.cache.event;
          if (eventCache) {
            for (let eventData of eventCache.values()) {
              node.removeEventListener(eventData.name, eventData.wrapper);
            }
            eventCache.clear();
          }
        }
      }
      // i = nodes.length;
      // while (i--) nodes[i].remove();
      let nodeGroup = context.removedNodes.get(id);
      if (!nodeGroup) context.removedNodes.set(id, (nodeGroup = []));
      nodeGroup.push(nodes);
    },
  };
}

function parseTemplate(parts) {
  let id = Symbol();
  if (parts.length === 1)
    return { id, html: parts[0], query: null, slots: emptyArray };

  let slots = [];
  let html = [];
  let query = [];
  // unknown = 0, openTag = 1, singleQuote = 2, doubleQuote = 3
  let current = 0;
  let matches = [...parts.join(slotToken).matchAll(templatePattern)];
  while (matches.length) {
    let [match] = matches.shift();
    switch (match[0]) {
      case "<":
        current = match[1] === "/" ? 0 : 1;
        break;
      case ">":
        current = 0;
        break;
      case "@":
        let attr = `hta-${slots.length}`;
        query.push(`[${attr}="1"]`);
        html.push(
          current === 1
            ? ` ${attr}="1" `
            : `<${templateTagName} ${slotAttributeName}="1" ${attr}="1"></${templateTagName}>`
        );
        slots[slots.length] = current === 1 ? directiveType : placeholderType;
        break;
      default:
    }
  }

  return {
    id,
    html: parts
      .reduce((prev, current, index) => prev + html[index - 1] + current)
      .trim(),
    query: query.join(","),
    slots,
  };
}

function renderTemplate(marker, html, query, slots) {
  let ns = marker.parentNode && marker.parentNode.namespaceURI;
  let templateElement = ns
    ? doc.createElementNS(ns, templateTagName)
    : doc.createElement(templateTagName);
  templateElement.innerHTML = html;
  let attachedNodes = !query
    ? emptyArray
    : [
        ...(templateElement.content || templateElement).querySelectorAll(query),
      ].map((node, index) => {
        let result = {
          path: getElementPath(node),
          bindings: slots
            .map((type, index) => ({ index, type }))
            .filter((slot) => node.getAttribute(`hta-${slot.index}`) === "1"),
        };
        if (node.getAttribute(slotAttributeName) === "1") {
          let marker = createMarker("placeholder " + index);
          node.before(marker);
          node.remove();
        }
        return result;
      });
  return {
    isSvg: !!ns,
    childNodes: [...(templateElement.content || templateElement).childNodes],
    attachedNodes,
  };
}

function getElementPath(element) {
  let path = [];
  while (element.parentNode) {
    let index = indexOf.call(element.parentNode.childNodes, element);
    path.unshift(index);
    element = element.parentNode;
  }
  return path;
}
