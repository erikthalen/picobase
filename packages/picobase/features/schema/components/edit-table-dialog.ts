import { html } from "hono/html";
import type { Column } from "../../tables/queries.ts";
import type { DesiredColumn, ForeignKey } from "../queries.ts";

const SQLITE_TYPES = [
  "TEXT",
  "INTEGER",
  "REAL",
  "BLOB",
  "NUMERIC",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "VARCHAR",
  "JSON",
];

const DEFAULT_SUGGESTIONS = [
  "NULL",
  "0",
  "1",
  "''",
  "CURRENT_TIMESTAMP",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "(datetime('now'))",
  "(datetime('now', 'localtime'))",
];

const css = String.raw;

const shellStyles = css`
  #edit-table-dialog {
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    padding: 0;
    color: var(--pb-text);
    width: min(90vw, 680px);
    height: 100vh;
    overflow: auto;
    position: fixed;
    top: 0;
    right: 0;
    left: auto;
    max-height: none;
  }
`;

const contentStyles = css`
  #edit-dialog-body {
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .etd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--pb-border);
  }
  .etd-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  .etd-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--pb-text-faint);
    line-height: 1;
  }
  .etd-col-labels {
    display: flex;
    gap: 8px;
    padding: 4px 0 6px;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--pb-text-faint);
    border-bottom: 2px solid var(--pb-border);
  }
  .etd-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 1rem;
  }
  .etd-footer-actions {
    display: flex;
    gap: 8px;
  }
  .edit-col-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--pb-border);
  }
  .edit-col-row--pk {
    opacity: 0.5;
  }
  .col-name {
    flex: 2;
    min-width: 0;
  }
  .col-type {
    flex: 1.5;
    min-width: 0;
  }
  .col-default {
    flex: 1.5;
    min-width: 0;
  }
  .col-fkref {
    flex: 2;
    min-width: 0;
    font-size: 11px;
  }
  .col-pk-spacer {
    flex: 2;
    min-width: 0;
  }
  .col-notnull-label {
    white-space: nowrap;
  }
  .col-delete-placeholder {
    display: inline-block;
    width: 28px;
  }
  .edit-col-row-delete {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    color: var(--pb-text-faint);
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .col-deleted {
    opacity: 0.35;
    text-decoration: line-through;
  }
  .col-deleted input,
  .col-deleted select {
    pointer-events: none;
  }
`;

/** Empty dialog shell rendered once in the ER diagram page */
export function editTableDialogShell() {
  return html`
    <dialog id="edit-table-dialog" data-ref="_editTableDialog" closedby="any">
      <style>
        ${shellStyles}
      </style>
      <div id="edit-dialog-body">
        <!-- Populated by SSE when edit button is clicked -->
      </div>
    </dialog>
  `;
}

/** One column row inside the dialog */
function colRow(
  i: number,
  col: {
    name: string;
    type: string;
    dflt_value: string;
    notnull: boolean;
    originalName: string;
    pk: boolean;
    fkRef: string;
  },
  otherSchema: { name: string; columns: { name: string }[] }[],
) {
  if (col.pk) {
    return html`
      <div
        id="edit-col-row-${i}"
        class="edit-col-row edit-col-row--pk"
        title="Primary key columns cannot be edited"
      >
        <input value="${col.name}" disabled class="col-name" />
        <input value="${col.type}" disabled class="col-type" />
        <input value="" disabled placeholder="—" class="col-default" />
        <span class="col-pk-spacer"></span>
        <input type="checkbox" checked disabled />
        <span class="col-delete-placeholder"></span>
      </div>
    `;
  }

  const fkRef = col.fkRef;
  const fkOptions = otherSchema.flatMap((t) =>
    t.columns.map((c) => {
      const val = `${t.name}.${c.name}`;
      return html`<option
        value="${val}"
        ${fkRef === val ? html` selected` : ""}
      >
        ${val}
      </option>`;
    }),
  );

  const fkSelect = html`<select
    data-bind:editcol_${i}_fkref
    class="col-fkref"
    title="Foreign key reference"
  >
    <option value="">— none —</option>
    ${fkOptions}
  </select>`;

  return html`
    <div
      id="edit-col-row-${i}"
      class="edit-col-row"
      data-class="{'col-deleted': $editcol_${i}_deleted}"
    >
      <input data-bind:editcol_${i}_name value="${col.name}" class="col-name" />
      <select data-bind:editcol_${i}_type class="col-type">
        ${SQLITE_TYPES.map(
          (t) =>
            html`<option value="${t}" ${t === col.type ? " selected" : ""}>
              ${t}
            </option>`,
        )}
      </select>
      <input
        list="col-defaults"
        data-bind:editcol_${i}_default
        value="${col.dflt_value}"
        placeholder="NULL"
        class="col-default"
      />
      ${fkSelect}
      <input
        type="checkbox"
        data-bind:editcol_${i}_notnull
        ${col.notnull ? "checked" : ""}
      />
      <button
        type="button"
        title="Remove column"
        data-on:click="$editcol_${i}_deleted = !$editcol_${i}_deleted"
        class="edit-col-row-delete"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-x"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;
}

/** Full dialog body content — patched via SSE when edit button is clicked */
export function editTableDialogContent(
  tableName: string,
  dbColumns: Column[],
  base: string,
  pending: DesiredColumn[] | null,
  otherSchema: { name: string; columns: { name: string }[] }[],
  currentFKs: ForeignKey[],
) {
  const fkMap = new Map(
    currentFKs.map((fk) => [fk.from, `${fk.table}.${fk.to}`]),
  );

  const cols: Array<{
    name: string;
    type: string;
    dflt_value: string;
    notnull: boolean;
    originalName: string;
    pk: boolean;
    fkRef: string;
  }> = pending
    ? pending.map((d) => ({
        name: d.name,
        type: d.type,
        dflt_value: d.dflt_value,
        notnull: d.notnull,
        originalName: d.originalName,
        pk: dbColumns.find((c) => c.name === d.originalName)?.pk ?? false,
        fkRef: d.fkRef ?? "",
      }))
    : dbColumns.map((c) => ({
        name: c.name,
        type: c.type || "TEXT",
        dflt_value: c.dflt_value == null ? "" : String(c.dflt_value),
        notnull: c.notnull,
        originalName: c.name,
        pk: c.pk,
        fkRef: fkMap.get(c.name) ?? "",
      }));

  const rows = cols.map((col, i) => colRow(i, col, otherSchema));

  return html`
    <style>
      ${contentStyles}
    </style>

    <div class="etd-header">
      <h2>${tableName}</h2>
      <button
        type="button"
        data-on:click="$_editTableDialog.close()"
        class="etd-close-btn"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon icon-tabler icons-tabler-outline icon-tabler-x"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="etd-col-labels">
      <span class="col-name">Name</span>
      <span class="col-type">Type</span>
      <span class="col-default">Default</span>
      <span class="col-fkref">Ref</span>
      <span class="col-notnull-label">Not null</span>
      <span class="col-delete-placeholder"></span>
    </div>

    <div id="edit-dialog-col-list">${rows}</div>

    <datalist id="col-defaults">
      ${DEFAULT_SUGGESTIONS.map((s) => html`<option value="${s}"></option>`)}
    </datalist>

    <div class="etd-footer">
      <button
        type="button"
        data-on:click="@get('${base}/schema/tables/${tableName}/new-column-row?idx=' + $editColCount)"
      >
        + Add column
      </button>
      <div class="etd-footer-actions">
        <button type="button" data-on:click="$_editTableDialog.close()">
          Cancel
        </button>
        <button
          type="button"
          class="primary"
          data-on:click="@post('${base}/schema/tables/${tableName}/pending'); $_editTableDialog.close()"
        >
          Save changes
        </button>
      </div>
    </div>
  `;
}

/** A single new empty column row (appended via SSE on "Add column") */
export function newEmptyColRow(
  i: number,
  otherSchema: { name: string; columns: { name: string }[] }[],
) {
  const fkOptions = otherSchema.flatMap((t) =>
    t.columns.map((c) => {
      const val = `${t.name}.${c.name}`;
      return html`<option value="${val}">${val}</option>`;
    }),
  );

  const fkSelect = html`<select
    data-bind:editcol_${i}_fkref
    class="col-fkref"
    title="Foreign key reference"
  >
    <option value="">— none —</option>
    ${fkOptions}
  </select>`;

  return html`
    <div
      id="edit-col-row-${i}"
      class="edit-col-row"
      data-class="{'col-deleted': $editcol_${i}_deleted}"
    >
      <input
        data-bind:editcol_${i}_name
        placeholder="column_name"
        class="col-name"
      />
      <select data-bind:editcol_${i}_type class="col-type">
        ${SQLITE_TYPES.map((t) => html`<option value="${t}">${t}</option>`)}
      </select>
      <input
        list="col-defaults"
        data-bind:editcol_${i}_default
        placeholder="NULL"
        class="col-default"
      />
      ${fkSelect}
      <input type="checkbox" data-bind:editcol_${i}_notnull />
      <button
        type="button"
        title="Remove column"
        data-on:click="$editcol_${i}_deleted = !$editcol_${i}_deleted"
        class="edit-col-row-delete"
      >
        ×
      </button>
    </div>
  `;
}
