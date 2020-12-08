export default function patchNode(context, data, node, props) {
  if (!node.$$initData) {
    node.$$initData = {
      class: node.getAttribute("class"),
      style: node.getAttribute("style"),
    };
  }
  if (!props || data.prev === props) return;
  data.prev = props;
  for (let prop in props) {
    // if (!props.hasOwnProperty(prop)) continue;
    let propValue = props[prop];
    let prevPropValue = data.props.get(prop);
    if (propValue === prevPropValue) continue;
    data.props.set(prop, propValue);
    if (prop === "text") {
      node.textContent = propValue;
      continue;
    }
    if (prop === "html") {
      node.innerHTML = propValue;
      continue;
    }
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
        patchGroup(context, node, data.props, null, propValue, patchEvent);
      } else {
        patchEvent(context, node, prop.substr(2), propValue, prevPropValue);
      }
    } else if (prop === "class") {
      patchGroup(
        context,
        node,
        data.class,
        patchClassString,
        propValue,
        patchClass
      );
    } else if (prop === "attr") {
      patchGroup(context, node, data.props, null, propValue, patchAttribute);
    } else if (prop === "style") {
      patchGroup(
        context,
        node,
        data.style,
        patchStyleString,
        propValue,
        patchStyle
      );
    } else {
      node[prop] = propValue;
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
  node.setAttribute(
    "class",
    node.$$initData.class +
      " " +
      (typeof value === "boolean" || !value ? "" : value)
  );
}

function patchStyleString(node, value) {
  node.setAttribute(
    "style",
    node.$$initData.style +
      ";" +
      (typeof value === "boolean" || !value ? "" : value)
  );
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
  prev && node.removeEventListener(name, prev[context.appId]);
  if (current) {
    let wrapper = (current[context.appId] = (e) =>
      context.dispatch(current, e));
    node.addEventListener(name, wrapper);
  }
}
