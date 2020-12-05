export default function patchNode(context, data, node, props) {
  if (!props || data.prev === props) return;
  data.prev = props;
  for (let prop in props) {
    // if (!props.hasOwnProperty(prop)) continue;
    let propValue = props[prop];
    let prevPropValue = data.props.get(prop);
    if (propValue === prevPropValue) continue;
    data.props.set(prop, propValue);

    if (prop[0] === "o" && prop[1] === "n") {
      if (prop.length === 2) {
        if (!propValue) continue;
        patchGroup(node, data.props, null, propValue, patchEvent);
      } else {
        patchEvent(node, prop.substr(2), propValue, prevPropValue);
      }
    } else if (prop === "class") {
      patchGroup(node, data.class, "class", propValue, patchClass);
    } else if (prop === "attr") {
      patchGroup(node, data.props, null, propValue, patchAttribute);
    } else if (prop === "style") {
      patchGroup(node, data.style, "style", propValue, patchStyle);
    } else {
      node[prop] = propValue;
    }
  }
}

function patchClass(node, name, value) {
  node.classList.toggle(name, !!value);
}

function patchAttribute(node, name, value) {
  // let nodeAttr = node.getAttributeNode(name);
  // if (!nodeAttr) {
  //   nodeAttr = doc.createAttribute(name);
  //   node.setAttributeNode(nodeAttr);
  // }
  // nodeAttr.nodeValue = value;
  node.setAttribute(name, value);
}

function patchStyle(node, name, value) {
  node.style[name] = value;
}

function patchGroup(node, map, groupName, groupValue, patchItem) {
  if (groupValue && typeof groupValue === "object") {
    for (let itemName in groupValue) {
      let itemValue = groupValue[itemName];
      let prevItemValue = map.get(itemName);
      if (prevItemValue === itemValue) continue;
      map.set(itemName, itemValue);
      patchItem(node, itemName, itemValue, prevItemValue);
    }
  } else if (groupName) {
    node.setAttribute(groupName, groupValue);
  }
}

function patchEvent(node, name, current, prev) {
  prev && node.removeEventListener(name, prev);
  current && node.addEventListener(name, current);
}
