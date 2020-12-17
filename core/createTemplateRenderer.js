import arrayEqual from "./arrayEqual";
import createMarker from "./createMarker";
import globalContext from "./globalContext";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";
import patchNode from "./patchNode";
import {
  directiveType,
  templateType,
  placeholderType,
  keyedType,
} from "./types";
import { doc, emptyArray, indexOf, isArray, unset } from "./util";

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
  let onUpdate;
  if (!template) {
    let { html, query, slots } = parseTemplate(strings);
    template = renderTemplate(marker, html, query, slots);
    cache[id] = template;
  }
  let nodes = template.clone();
  marker.before(...nodes);
  let bindings = [];
  let rootNode = { childNodes: nodes };
  let unmounted = false;
  let state = {};
  let asyncHandler = context.asyncHandler;
  let effects = [];
  let mounted = false;
  let unsubscribe;
  let updateToken;
  let reactiveBindings = emptyArray;
  let component = {
    effect(fn, deps) {
      if (!mounted && !deps) return fn(context);
      effects[effectIndex] = { ...effects[effectIndex], fn, deps };
      effectIndex++;
    },
  };
  let effectIndex = 0;

  template.attachedNodes.some((attachedNode) => {
    let node = attachedNode.path.reduce(
      (parent, index) => parent.childNodes[index],
      rootNode
    );
    attachedNode.bindings.some((b) => {
      bindings.unshift({
        prev: unset,
        marker: node,
        type: b.type,
        index: b.index,
        props: {},
      });
    });
  });

  function bind(template) {
    bindings.some((binding) => {
      binding.prev = binding.value;
      binding.value = template.values[binding.index];
    });
  }

  function handleUpdate() {
    if (updateToken === context.updateToken) return;
    onUpdate && onUpdate();
    reactiveBindings.some((binding) => {
      updateBinding(binding, binding.value(state, context));
    });
  }

  function updateBinding(binding, value) {
    if (unmounted) return;
    if (value && value.type === keyedType) value = value.content;

    let nextKey = value ? value.key : undefined;
    if (nextKey !== void 0) {
      // do nothing if binding has the same previous key
      if (isEqual(binding.key, nextKey)) return;
      binding.key = nextKey;
      if (value.bind) value = value.bind(nextKey);
    }
    if (!isArray(value) && binding.prev === value) return;

    binding.prev = value;
    if (isPromiseLike(value)) {
      let promise = (binding.lastPromise = value);
      return promise.then((asyncValue) => {
        if (binding.lastPromise !== promise) return;
        updateBinding(binding, asyncValue);
      });
    }
    binding.lastPromise = null;
    if (binding.type === directiveType) {
      patchNode(context, binding.props, binding.marker, value);
    } else {
      mount(context, binding, value);
    }
    runEffects();
  }

  function runEffects() {
    mounted = true;
    if (!effectIndex) return;
    effects.some((effect) => {
      if (arrayEqual(effect.prev, effect.deps)) return;
      effect.prev = effect.deps;
      effect.dispose && effect.dispose();
      effect.dispose = effect.fn(context);
    });
  }

  function updateBindings() {
    bindings.some((binding) => {
      let value = binding.value;
      if (value && value.call) {
        reactiveBindings[reactiveBindings.length] = binding;
        if (!unsubscribe) {
          unsubscribe = context.addBinding(handleUpdate);
        }
        value = value(state, context);
      }
      updateBinding(binding, value);
    });
    if (!reactiveBindings.length && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return {
    id,
    type: templateType,
    reorder() {
      marker.before(...nodes);
    },
    update(template) {
      if (unmounted) return;
      onUpdate = template.onUpdate;
      updateToken = context.updateToken;
      let prevComponent = globalContext.component;
      bind(template);
      reactiveBindings = [];
      try {
        globalContext.component = component;
        onUpdate && onUpdate();
        updateBindings();
        runEffects();
      } catch (e) {
        if (isPromiseLike(e) && asyncHandler) return asyncHandler(e);
        throw e;
      } finally {
        globalContext.component = prevComponent;
      }
    },
    unmount() {
      if (unmounted) return;
      unmounted = true;
      unsubscribe && unsubscribe();
      bindings.some((binding) => {
        binding.renderer && binding.renderer.unmount();
        if (binding.type === directiveType) {
          let node = binding.marker;
          let data = node.$$data;
          let eventCache = data && data.cache.event;
          if (eventCache && eventCache.size) {
            eventCache.forEach((eventData) => {
              node.removeEventListener(eventData.name, eventData.wrapper);
            });
            eventCache.clear();
          }
        }
      });
      nodes.some((node) => {
        node.remove();
      });
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
    clone() {
      let cloned = templateElement.cloneNode(true);
      return [...(cloned.content || cloned).childNodes];
    },
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
