import { part, store, context } from "rxapp";

const [LanguageProvider, currentLanguage] = context("unknown");

const StaticCurrentLanguage = part(
  () => part`<h2>Static: ${currentLanguage()}</h2>`
);
const DynamicCurrentLanguage = part(() => () =>
  part`<h2>Dynamic: ${currentLanguage()}</h2>`
);

const App = part(() => {
  let state = store({ lang: "en" });
  return () => part`
    <h1>Choose language</h1>
    <h2>Current: ${state.lang}</h2>
    <button ${{ onclick: () => (state.lang = "en") }}>English</button>
    <button ${{ onclick: () => (state.lang = "es") }}>Spanish</button>
    <hr/>
    <h1>Without context provider</h1>
    ${StaticCurrentLanguage}
    ${DynamicCurrentLanguage}
    <hr/>
    <h1>With context provider</h1>
    ${LanguageProvider({ value: state.lang })`
      ${StaticCurrentLanguage}
      ${DynamicCurrentLanguage}
    `}
`;
});
App.mount("#app");
