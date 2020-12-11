import { debounce, Suspense } from "../../async";
import { part, chunk } from "../../core";

const maxCoins = 10000;
let term = "";
let orderBy = null;
let desc = null;
let coins = [];
let filteredCoins;

const Text = (props) => () => {
  let { text } = props;
  if (!term) return text;
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) return text;
  const before = text.substr(0, index);
  const middle = text.substr(index, term.length);
  const after = text.substr(index + term.length);
  return part`${before}<span style="color: red">${middle}</span>${after}`;
};

const Row = part(
  ({ coin }) => part`
  <tr>
    <td style="width: 80px">${Text({ text: coin.Id })}</td>
    <td style="width: 150px">${Text({ text: coin.Symbol })}</td>
    <td>${Text({ text: coin.FullName })}</td>
    <td style="width: 180px">${coin.TotalCoinsMined}</td>
    <td style="width: 100px"><img style="width: 30px" ${{
      src: `https://cryptocompare.com${coin.ImageUrl || ""}`,
    }}/></td>
  </tr>
`
);

const Header = ({ width, column }) => {
  let headerPropsBinding = () => ({
    onclick: (e) => Sort(e, column),
    style: { fontWeight: orderBy === column ? "bold" : "normal" },
  });
  let headerTextBinding = () =>
    orderBy === column ? `${column} ${desc ? "⬇️" : "⬆️"}` : column;
  return part`
  <th style="height: 40px; vertical-align: middle" ${{
    style: `width: ${width}px`,
  }}>
    <a href="#" ${headerPropsBinding}>${headerTextBinding}</a>
  </th>`;
};

const Table = part(() => {
  const totalCoinBinding = () => coins.length;
  const rowChunk = chunk({
    size: 25,
    key: "Id",
    render: (items) =>
      part`<tbody>${items.map((coin) => Row({ coin, key: coin.Id }))}</tbody>`,
  });

  return part`
  <h1>Crypto Search</h1>
  <div class="form-group">
    <input type="email"
      class="form-control"
      placeholder="Search coin" ${{ oninput: debounce(Search, 200) }}/>
  </div>
  <small style="margin-left: 10px;" class="form-text text-muted">${totalCoinBinding} coins found</small>
  <table class="table table-striped table-bordered table-sm">
    <thead>
      <tr>
      ${Header({ column: "Id", orderBy, desc, width: 80 })}
      ${Header({ column: "Symbol", orderBy, desc, width: 100 })}
      ${Header({ column: "FullName", orderBy, desc })}
      ${Header({ column: "TotalCoinsMined", orderBy, desc, width: 180 })}
      ${Header({ column: "Image", orderBy, desc, width: 100 })}
      </tr>
    </thead>
    ${() => rowChunk(filteredCoins || coins)}
  </table>`;
});

part`
${Suspense({ fallback: "Loading...", children: Table })}
`.mount({
  container: "#app",
  init() {
    return fetch("https://min-api.cryptocompare.com/data/all/coinlist", {
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => {
        coins = Object.entries(data.Data)
          .slice(0, maxCoins)
          .map(([Symbol, coin]) => ({
            ...coin,
            FullName: coin.FullName.trim(),
            Symbol,
          }));
      });
  },
});

// define actions
function Search(e) {
  term = e.target.value;
  filterCoins();
}

function filterCoins() {
  const lowerTerm = term.toLowerCase();
  if (term) {
    const lowerTerm = term.toLowerCase();
    filteredCoins = coins.filter(
      (coin) =>
        coin.Id.toLowerCase().includes(lowerTerm) ||
        coin.Symbol.toLowerCase().includes(lowerTerm) ||
        coin.FullName.toLowerCase().includes(lowerTerm)
    );
  } else {
    filteredCoins = coins.slice();
  }
  const step = desc ? -1 : 1;
  filteredCoins.sort((a, b) => {
    const av = a[orderBy] || 0;
    const bv = b[orderBy] || 0;
    if (av > bv) return step;
    if (av < bv) return -1 * step;
    return 0;
  });
}

function Sort(e, column) {
  // cancel A element behavior
  event.preventDefault();
  // invert sort direction if user click on the same column
  if (orderBy === column) {
    desc = !desc;
  } else {
    desc = false;
    orderBy = column;
  }
  filterCoins();
}
