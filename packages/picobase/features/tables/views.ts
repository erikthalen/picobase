import { html, raw } from "hono/html";
import type { Column } from "./queries.ts";

const css = String.raw;

const emptyStateStyles = css`
  .tables-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
    gap: 0.75rem;
  }
  .tables-empty-icon {
    background: var(--pb-bg);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pb-text-muted);
    margin-bottom: 0.5rem;
  }
  .tables-empty-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
  .tables-empty-body {
    font-size: 0.875rem;
    color: var(--pb-text-muted);
    max-width: 300px;
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }
`;

const rowsStyles = css`
  .rows-wrapper {
    display: contents;
  }
  .row-count {
    margin: 0.5rem;
    font-size: 0.8rem;
  }
  .pk-cell {
    font-size: 0.8rem;
  }
`;

export function tableListView(tables: string[], basePath: string): string {
  const base = basePath.replace(/\/$/, "");
  if (tables.length === 0) {
    return String(
      html`<div id="tables-view">
        <style>
          ${emptyStateStyles}
        </style>
        <div class="tables-empty">
          <div class="tables-empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-table-off"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M7 3h12a2 2 0 0 1 2 2v12m-.585 3.413a1.994 1.994 0 0 1 -1.415 .587h-14a2 2 0 0 1 -2 -2v-14c0 -.55 .223 -1.05 .583 -1.412"
              />
              <path d="M3 10h7m4 0h7" />
              <path d="M10 3v3m0 4v11" />
              <path d="M3 3l18 18" />
            </svg>
          </div>
          <h3 class="tables-empty-title">No tables yet</h3>
          <p class="tables-empty-body">
            Create your first table in the Schema view to start storing data.
          </p>
          <button
            class="primary"
            data-on:click="@get('${base}/schema/diagram')"
          >
            Go to Schema
          </button>
        </div>
      </div>`,
    );
  }
  const rows = tables
    .map(
      (t) =>
        `<tr><td><a href="${basePath}/tables/${t}" data-on:click="@get('${basePath}/tables/${t}')">${t}</a></td></tr>`,
    )
    .join("\n");
  return String(
    html` <table>
      <thead>
        <tr>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        ${raw(rows)}
      </tbody>
    </table>`,
  );
}

export function rowsView(opts: {
  table: string;
  tables: string[];
  columns: Column[];
  rows: Record<string, unknown>[];
  page: number;
  total: number;
  limit: number;
  basePath: string;
}): string {
  const { table, tables, columns, rows, page, total, limit, basePath } = opts;
  const totalPages = Math.ceil(total / limit);
  const pkCol = columns.find((c) => c.pk);

  const headers = columns
    .map(
      (c) =>
        `<th>${c.name}${c.pk ? ' <span class="badge pk">PK</span>' : ""}</th>`,
    )
    .join("");

  const dataRows = rows
    .map((row) => {
      const rowid = pkCol ? row[pkCol.name] : null;
      const cells = columns
        .map((c) => {
          const val = String(row[c.name] ?? "");
          return `<td>${val}</td>`;
        })
        .join("");
      return `<tr id="row-${rowid}">${cells}<td>
  <button class="danger" data-on:click="@delete('${basePath}/tables/${table}/${rowid}')">Delete</button>
</td></tr>`;
    })
    .join("\n");

  // Build page number list with ellipsis gaps
  const pageNums = [
    ...new Set(
      [1, totalPages, page - 1, page, page + 1].filter(
        (p) => p >= 1 && p <= totalPages,
      ),
    ),
  ].sort((a, b) => a - b);
  const pageItems: (number | "...")[] = [];
  for (let i = 0; i < pageNums.length; i++) {
    if (i > 0 && pageNums[i] - pageNums[i - 1] > 1) pageItems.push("...");
    pageItems.push(pageNums[i]);
  }
  const pageUrl = (p: number) =>
    `@get('${basePath}/tables/${table}?page=${p}')`;
  const pageButtons = pageItems
    .map((item) =>
      item === "..."
        ? `<span class="pagination-dots">···</span>`
        : item === page
          ? `<button class="pagination-btn active">${item}</button>`
          : `<button class="pagination-btn" data-on:click="${pageUrl(item)}">${item}</button>`,
    )
    .join("");

  const pagination =
    totalPages > 1
      ? `<nav class="pagination">
          ${page > 1 ? `<button class="pagination-btn" data-on:click="${pageUrl(page - 1)}">&#8249; Previous</button>` : `<button class="pagination-btn" disabled>&#8249; Previous</button>`}
          <span class="pagination-buttons">
          ${pageButtons}
          </span>
          ${page < totalPages ? `<button class="pagination-btn" data-on:click="${pageUrl(page + 1)}">Next &#8250;</button>` : `<button class="pagination-btn" disabled>Next &#8250;</button>`}
        </nav>`
      : `<p class="text-muted row-count">${total} row${total !== 1 ? "s" : ""}</p>`;

  // Insert row — one input per non-PK column, pinned to bottom of table
  const insertCols = columns.filter((c) => !c.pk);
  const colSignals = insertCols.map((c) => `${c.name}:''`).join(",");
  const signalsAttr = colSignals ? `{${colSignals}}` : `{}`;
  const resetSignals = insertCols.map((c) => `$${c.name}=''`).join(";");

  const insertCells = columns
    .map((c) => {
      if (c.pk) return `<td class="text-faint pk-cell">—</td>`;
      const hasDefault = c.dflt_value != null;
      const placeholder = hasDefault
        ? `default: ${c.dflt_value}`
        : c.type || "text";
      const required = c.notnull && !hasDefault ? " required" : "";
      return `<td><input data-bind:${c.name} placeholder="${placeholder}"${required}></td>`;
    })
    .join("");

  const insertRow =
    insertCols.length > 0
      ? `<tr>${insertCells}<td><button class="primary" data-on:click="@post('${basePath}/tables/${table}')${resetSignals ? `;${resetSignals}` : ""}">Add</button></td></tr>`
      : "";

  const tabBar =
    tables.length > 0
      ? `<nav id="table-tabs" class="tab-bar">${tables.map((t) => `<a href="${basePath}/tables/${t}" data-on:click="@get('${basePath}/tables/${t}')"${t === table ? ' class="active"' : ""}>${t}</a>`).join("")}</nav>`
      : "";

  return String(
    html`<div
      id="rows-view"
      class="rows-wrapper"
      data-signals="${raw(signalsAttr)}"
    >
      <style>
        ${rowsStyles}
      </style>
      ${raw(tabBar)}
      <table>
        <thead>
          <tr>
            ${raw(headers)}
            <th></th>
          </tr>
        </thead>
        <tbody id="rows-${table}">
          ${raw(insertRow)} ${raw(dataRows)}
        </tbody>
      </table>
      ${raw(pagination)}
    </div>`,
  );
}
