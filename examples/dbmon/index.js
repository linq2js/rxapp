import { Chunk, part } from "../../core";

let rows = [];

part`
  <div>
    <table class="table table-striped latest-data">
      ${() =>
        Chunk({
          data: rows,
          size: 10,
          render: (rows) => part`
        <tbody>
        ${() =>
          rows.map(
            (row) => part.key(row.dbname)`
          <tr>
            <td class="dbname">${row.dbname}</td>
            <td class="query-count">
              <span ${{
                key: row.lastSample.countClassName,
                class: row.lastSample.countClassName,
              }}>
                ${row.lastSample.nbQueries}
              </span>
            </td>
            ${row.lastSample.topFiveQueries.map(
              (query) =>
                part`
                <td ${{
                  key: query.elapsedClassName,
                  class: query.elapsedClassName,
                }}>
                  ${query.formatElapsed}
                  <div class="popover left">
                    <div class="popover-content">
                      ${query.query}
                      <div class="arrow"></div>
                    </div>
                  </div>
                </td>`
            )}
          </tr>`
          )}
      </tbody>`,
        })}
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
  actions: {
    generate() {
      rows = ENV.generateData().toArray(Monitoring.renderRate.ping());
    },
  },
});
