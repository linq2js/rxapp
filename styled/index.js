import createContext from "../core/createContext";
import createPart from "../core/createPart";
import { doc, emptyObject, isArray, slice } from "../core/util";
import { compile, serialize, stringify } from "stylis";

let styleElement;
let defaultTheme = {};
export let themContext = createContext(defaultTheme);
let [consumeTheme] = themContext;
let uuid = Date.now();
let cache = new Map();

function generateClass(props, strings, substitutions, overrideTheme) {
  let theme = overrideTheme || consumeTheme();
  let wrappedProps = { theme, ...props };
  let style = substitutions
    .reduce(
      (arr, value, index) => {
        arr.push(
          typeof value === "function" ? value(wrappedProps) : value,
          strings[index + 1]
        );
        return arr;
      },
      [strings[0]]
    )
    .join("");
  let klass = cache.get(style);
  if (!klass) cache.set(style, (klass = addStyle(style)));
  return { class: klass, props: wrappedProps };
}

function applyDocumentStyle(strings) {
  let substitutions = slice.call(arguments, 1);
  let result = generateClass(emptyObject, strings, substitutions, defaultTheme);
  doc.documentElement.classList.toggle(result.class, true);
}

export function styled(defaultTag, binding) {
  if (isArray(defaultTag)) {
    return applyDocumentStyle.apply(null, arguments);
  }
  let hasBinding = arguments.length > 1;
  let defaultGeneratedClass;
  return function (strings) {
    let substitutions = slice.call(arguments, 1);

    function render(tag, props = emptyObject) {
      let result = generateClass(props, strings, substitutions);
      result.props.class = result.class;
      if (typeof tag === "function") return tag(result.props);
      result.props.inner = null;
      let templateFactory =
        "key" in result.props ? createPart.key(result.props.key) : createPart;
      if (!hasBinding) {
        return templateFactory([`<${tag} `, `/>`], {
          class: result.class,
          ...props,
        });
      }

      let wrappedBinding = {
        class: result.class,
        ...(typeof binding === "function" ? binding(result.props) : binding),
      };
      return "children" in props
        ? templateFactory(
            [`<${tag} `, ">", `</${tag}>`],
            wrappedBinding,
            props.children
          )
        : templateFactory([`<${tag} `, `/>`], wrappedBinding);
    }

    return Object.assign(
      function (props) {
        return render(defaultTag, props);
      },
      {
        as(tag) {
          return function (props) {
            return render(tag, props);
          };
        },
        toString() {
          if (!defaultGeneratedClass) {
            defaultGeneratedClass = generateClass(
              emptyObject,
              strings,
              substitutions
            ).class;
          }
          return defaultGeneratedClass;
        },
      }
    );
  };
}

function addStyle(style) {
  if (!styleElement) {
    styleElement = doc.createElement("style");
    (doc.querySelector("head") || doc.body).appendChild(styleElement);
  }
  let className = "_" + (uuid++).toString(16);
  let serializedStyle = serialize(compile(`.${className}{${style}`), stringify);
  styleElement.appendChild(document.createTextNode(serializedStyle));
  return className;
}
