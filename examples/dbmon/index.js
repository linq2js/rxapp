import { memo, part } from "../../core";

let rows = [];

const renderQueries = memo.list(
  (query) => ({
    class: query.elapsedClassName,
    text: query.query,
    elapsed: query.formatElapsed,
  }),
  (data) => part`
      <td ${{ class: data.class }}>
        ${data.elapsed}
        <div class="popover left">
          <div class="popover-content">
            ${data.text}
            <div class="arrow"></div>
          </div>
        </div>
      </td>`
);

const renderRows = memo.list(
  (row) => ({
    key: row.dbname,
    class: row.lastSample.countClassName,
    text: row.lastSample.nbQueries,
    queries: row.lastSample.topFiveQueries,
  }),
  (data) => part.key(data.key)`
      <tr>
        <td class="dbname">${data.key}</td>
        <td class="query-count">
          <span ${{ class: data.class }}>
            ${data.text}
          </span>
        </td>
        ${renderQueries(data.queries)}
      </tr>`
);

part`
  <div>
    <table class="table table-striped latest-data">
      <tbody>
        ${() => renderRows(rows)}
      </tbody>
    </table>
  </div>
`.mount({
  container: "#app",
  init({ actions }) {
    function next() {
      actions.generate();
      setTimeout(next, ENV.timeout);
    }

    next();
  },
  effects: [[() => Monitoring.renderRate.ping(), () => false]],
  actions: {
    generate() {
      rows = ENV.generateData().toArray();
    },
  },
});
