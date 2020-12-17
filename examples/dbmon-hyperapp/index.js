import { h, app, text } from "./hyperapp";

app({
  init: { rows: [] },
  node: document.getElementById("app"),
  view: (state) =>
    h(
      "div",
      {},
      h(
        "table",
        { class: "table table-striped latest-data" },
        h(
          "tbody",
          {},
          state.rows.map((row) =>
            h(
              "tr",
              { key: row.dbname },
              [
                h("td", { class: "dbname" }, text(row.dbname)),
                h(
                  "td",
                  { class: "query-count" },
                  h(
                    "span",
                    { class: row.lastSample.countClassName },
                    text(row.lastSample.nbQueries)
                  )
                ),
              ].concat(
                row.lastSample.topFiveQueries.map((query) =>
                  h(
                    "td",
                    { class: query.elapsedClassName },
                    text(query.formatElapsed),
                    h(
                      "div",
                      { class: "popover left" },
                      h(
                        "div",
                        { class: "popover-content" },
                        text(query.query),
                        h("div", { class: "arrow" })
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
  subscriptions() {
    // if (started) return [[() => {}]];
    return [[next, Symbol()]];
  },
});
let appDispatch;
function update(state) {
  return {
    ...state,
    rows: ENV.generateData().toArray(Monitoring.renderRate.ping()),
  };
}

function next(dispatch) {
  appDispatch = dispatch;
}

setInterval(() => {
  appDispatch && appDispatch(update);
}, ENV.timeout);
