# rxapp

The tiny framework (6K GZipped) for building reactive web app

## Counter App

```js
import { part } from "rxapp";

let count = 0;
part`
  <h1>Counter App</h1>
  <h2>Count: ${() => count}</h2>
  <button ${{ onclick: () => count++ }}>Increase</button>
`.mount();
```
