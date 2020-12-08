import { part, context } from "../../core";

const [LanguageProvider, consumeLanguage] = context("unknown");

const StaticCurrentLanguage = part(() => {
  let language = consumeLanguage();
  return part`<h2>Static: ${language.current}</h2>`;
});
const DynamicCurrentLanguage = part(() => {
  let language = consumeLanguage();
  return part`<h2>Dynamic1: ${() => language.current}</h2>`;
});
const DynamicCurrentLanguage2 = part(() => {
  return part`<h2>Dynamic2: ${consumeLanguage()}</h2>`;
});

const App = part(() => {
  let lang = "en";
  return () => part`
    <h1>Choose language</h1>
    <h2>Current: ${() => lang}</h2>
    <button ${{ onclick: () => (lang = "en") }}>English</button>
    <button ${{ onclick: () => (lang = "es") }}>Spanish</button>
    <hr/>
    <h1>Without context provider</h1>
    ${StaticCurrentLanguage}
    ${DynamicCurrentLanguage}
    ${DynamicCurrentLanguage2}
    <hr/>
    <h1>With context provider</h1>
    ${LanguageProvider({ value: () => lang })`
      ${StaticCurrentLanguage}
      ${DynamicCurrentLanguage}
      ${DynamicCurrentLanguage2}
    `}
`;
});
App.mount("#app");
