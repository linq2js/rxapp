export default function patchNode(context, data, node, props) {
  if (!node.$$data) {
    node.$$data = {
      class: node.getAttribute("class") || "",
      style: node.getAttribute("style") || "",
      cache: {
        style: new Map(),
        props: new Map(),
        class: new Map(),
        event: new Map(),
      },
    };
  }
  let cache = node.$$data.cache;
  if (!props || data.prev === props) return;
  data.prev = props;
  for (let prop in props) {
    // if (!props.hasOwnProperty(prop)) continue;
    let propValue = props[prop];
    let prevPropValue = cache.props.get(prop);
    if (propValue === prevPropValue) continue;
    cache.props.set(prop, propValue);
    if (prop[0] === "@") {
      node.setAttribute(prop.substr(1), propValue);
      continue;
    }
    if (prop[0] === ".") {
      node.classList.toggle(prop.substr(1), !!propValue);
      continue;
    }
    if (prop[0] === "$") {
      node.style[prop.substr(1)] = propValue;
      continue;
    }
    if (prop[0] === "o" && prop[1] === "n") {
      if (prop.length === 2) {
        if (!propValue) continue;
        patchGroup(context, node, cache.props, null, propValue, patchEvent);
      } else {
        patchEvent(context, node, prop.substr(2), propValue, prevPropValue);
      }
    } else {
      switch (prop) {
        case "ref":
          propValue &&
            (typeof propValue === "function"
              ? propValue(node)
              : (propValue.current = node));
          break;
        case "text":
          node.textContent = propValue;
          break;
        case "html":
          node.innerHTML = propValue;
          break;
        case "class":
          patchGroup(
            context,
            node,
            cache.class,
            patchClassString,
            propValue,
            patchClass
          );
          break;
        case "attr":
          patchGroup(
            context,
            node,
            cache.props,
            null,
            propValue,
            patchAttribute
          );
          break;
        case "style":
          patchGroup(
            context,
            node,
            cache.style,
            patchStyleString,
            propValue,
            patchStyle
          );
          break;
        default:
          node[prop] = propValue;
      }
    }
  }
}

function patchClass(context, node, name, value) {
  node.classList.toggle(name, !!value);
}

function patchAttribute(context, node, name, value) {
  node.setAttribute(name, value);
}

function patchClassString(node, value) {
  value = typeof value === "boolean" || !value ? "" : value;
  let initClass = node.$$data.class;
  node.setAttribute("class", initClass ? initClass + " " + value : value);
}

function patchStyleString(node, value) {
  value = typeof value === "boolean" || !value ? "" : value;
  let initStyle = node.$$data.style;
  node.setAttribute("style", initStyle ? initStyle + ";" + value : value);
}

function patchStyle(context, node, name, value) {
  node.style[name] = value;
}

function patchGroup(context, node, map, groupName, groupValue, patcher) {
  if (groupValue && typeof groupValue === "object") {
    for (let itemName in groupValue) {
      patchItem(context, node, map, itemName, groupValue[itemName], patcher);
    }
  } else if (groupName) {
    if (typeof groupName === "function") {
      groupName(node, groupValue);
    } else {
      node.setAttribute(groupName, groupValue);
    }
  }
}

function patchItem(context, node, map, itemName, itemValue, patcher) {
  let prevItemValue = map.get(itemName);
  if (prevItemValue === itemValue) return;
  map.set(itemName, itemValue);
  patcher(context, node, itemName, itemValue, prevItemValue);
}

function patchEvent(context, node, name, current, prev) {
  let eventCache = node.$$data.cache.event;
  if (prev) {
    let eventData = eventCache.get(prev);
    if (eventData) {
      node.removeEventListener(name, eventData.wrapper);
      eventCache.delete(prev);
    }
  }
  if (current) {
    let wrapper = (e) => context.dispatch(current, e);
    eventCache.set(current, {
      wrapper,
      name,
    });
    node.addEventListener(name, wrapper);
  }
}
