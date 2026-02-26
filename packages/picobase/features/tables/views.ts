import { html, raw } from "hono/html";
import type { Column } from "./queries.ts";

export function tableListView(tables: string[], basePath: string): string {
	const base = basePath.replace(/\/$/, "");
	if (tables.length === 0) {
		return String(
			html`<div
        style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:60vh;gap:1rem;text-align:center;padding:2rem;"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="color:var(--pb-text-faint)"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path
            d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14"
          />
          <path d="M3 10h18" />
          <path d="M10 3v18" />
        </svg>
        <div style="display:flex;flex-direction:column;gap:0.375rem">
          <p style="font-size:0.75rem;font-weight:500;color:var(--pb-text-heading)">
            No tables yet
          </p>
          <p style="font-size:0.75rem;line-height:1.4;color:var(--pb-text-muted);max-width:25ch;">
            Create a table in the Schema view to get started.
          </p>
        </div>
        <a
          href="${base}/schema/diagram"
          data-on:click="@get('${base}/schema/diagram')"
          style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.4375rem 0.875rem;border:1px solid var(--pb-border-input);border-radius:6px;font-size:0.8125rem;font-weight:500;color:var(--pb-text-heading);text-decoration:none;transition:background 0.12s,border-color 0.12s;"
          onmouseover="this.style.background='rgba(255,255,255,0.06)';this.style.borderColor='rgba(255,255,255,0.2)'"
          onmouseout="this.style.background='';this.style.borderColor=''"
        >
          Go to Schema
        </a>
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
			: `<p class="text-muted" style="margin:0.5rem;font-size:0.8rem">${total} row${total !== 1 ? "s" : ""}</p>`;

	// Insert row — one input per non-PK column, pinned to bottom of table
	const insertCols = columns.filter((c) => !c.pk);
	const colSignals = insertCols.map((c) => `${c.name}:''`).join(",");
	const signalsAttr = colSignals ? `{${colSignals}}` : `{}`;
	const resetSignals = insertCols.map((c) => `$${c.name}=''`).join(";");

	const insertCells = columns
		.map((c) => {
			if (c.pk) return `<td class="text-faint" style="font-size:0.8rem">—</td>`;
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
		html`<div style="display:contents;" data-signals="${raw(signalsAttr)}">
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
