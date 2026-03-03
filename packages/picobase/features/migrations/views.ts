import { html, raw } from "hono/html";
import type { MigrationFile } from "./queries.ts";

const css = String.raw;

const styles = css`
  #migrations-view {
  }
  .migrations-container {
    padding: 4.5rem 1.5rem 6rem;
    max-width: 780px;
    margin-inline: auto;
  }
  .migrations-card {
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 12px;
    overflow: hidden;
  }
  .migrations-controls {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .migrations-controls .ctrl-group {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 10px;
    padding: 3px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .migrations-controls .ctrl-group button {
    border: none;
    border-radius: 7px;
  }
  .migrations-controls .ctrl-group button:hover {
    border-color: transparent;
  }
  .migration-filename {
    font-family: monospace;
    font-size: 0.8rem;
  }
  #migration-sql-dialog {
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 8px;
    padding: 1.5rem;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 640px;
    color: inherit;
  }
  #migration-sql-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  .migration-sql-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 1rem;
  }
  .migration-sql-dialog-title {
    font-size: 0.875rem;
    font-weight: 600;
    font-family: monospace;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .migration-sql-pre {
    margin: 0;
    font-family: var(--pb-monospace);
    font-size: 0.8rem;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    color: #fafafa;
    background: var(--pb-syntax-bg);
    border-radius: 8px;
    padding: 1rem 1.25rem;
  }
  .sql-keyword { color: var(--pb-syntax-keyword); }
  .sql-string  { color: var(--pb-syntax-string); }
  .sql-comment { color: var(--pb-syntax-comment); font-style: italic; }
  .sql-number  { color: var(--pb-syntax-number); }
  #migration-editor {
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 500px;
    color: inherit;
  }
  .migration-form-title {
    margin-bottom: 1rem;
  }
  .migration-label {
    display: block;
    margin-bottom: 0.75rem;
  }
  .migration-label-title {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .migration-sql {
    font-family: monospace;
    font-size: 0.85rem;
  }
  .migration-btn-row {
    display: flex;
    gap: 0.5rem;
  }
  .new-migration-btn {
  }
  .migrations-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem 25vh;
    text-align: center;
    gap: 0.75rem;
    height: 100vh;
  }
  .migrations-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pb-text-faint);
    margin-bottom: 0.5rem;
  }
  .migrations-empty-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
  .migrations-empty-body {
    font-size: 0.875rem;
    color: var(--pb-text-muted);
    max-width: 300px;
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }
`;

export function migrationsView(opts: {
  files: MigrationFile[];
  applied: string[];
  basePath: string;
}): string {
  const { files, applied, basePath } = opts;
  const base = basePath.replace(/\/$/, "");
  const appliedSet = new Set(applied);

  const hasPending = files.some((f) => !appliedSet.has(f.name));

  const dialog = html`
    <dialog id="migration-editor" closedby="any">
      <div data-signals="{sql:'',filename:''}">
        <h3 class="migration-form-title">New migration</h3>
        <label class="migration-label">
          <span class="migration-label-title">
            Filename (e.g. 002_add_posts.sql)
          </span>
          <input data-bind:filename placeholder="002_description.sql" />
        </label>
        <label class="migration-label">
          <span class="migration-label-title">SQL</span>
          <textarea
            data-bind:sql
            rows="8"
            class="migration-sql"
            placeholder="CREATE TABLE ..."
          ></textarea>
        </label>
        <div class="migration-btn-row">
          <button class="primary" data-on:click="@post('${base}/migrations')">
            Save
          </button>
          <button
            class="primary"
            data-on:click="@post('${base}/migrations/save-and-run')"
          >
            Save &amp; Run
          </button>
          <form method="dialog">
            <button type="submit">Cancel</button>
          </form>
        </div>
      </div>
    </dialog>
  `;

  const sqlDialog = html`
    <dialog id="migration-sql-dialog" closedby="any">
      <div class="migration-sql-dialog-header">
        <h3 class="migration-sql-dialog-title" id="migration-sql-dialog-title">
        </h3>
        <form method="dialog">
          <button type="submit">Close</button>
        </form>
      </div>
      <div id="migration-sql-content"></div>
    </dialog>
  `;

  if (files.length === 0) {
    return String(html`
      <div id="migrations-view">
        <style>
          ${styles}
        </style>
        ${dialog} ${sqlDialog}
        <div class="migrations-empty">
          <div class="migrations-empty-icon">
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
              class="icon icon-tabler icons-tabler-outline icon-tabler-file-code"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path
                d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"
              />
              <path d="M10 13l-1 2l1 2" />
              <path d="M14 13l1 2l-1 2" />
            </svg>
          </div>
          <h3 class="migrations-empty-title">No migrations yet</h3>
          <p class="migrations-empty-body">
            Create SQL migration files to track and apply schema changes to your
            database.
          </p>
          <button
            class="primary"
            data-on:click="document.getElementById('migration-editor').showModal()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-plus"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 5l0 14" />
              <path d="M5 12l14 0" />
            </svg>
            New migration
          </button>
        </div>
      </div>
    `);
  }

  const rows = files
    .map((f) => {
      const isApplied = appliedSet.has(f.name);
      const statusBadge = isApplied
        ? '<span class="badge fk">Applied</span>'
        : '<span class="badge pk">Pending</span>';
      const runBtn = !isApplied
        ? `<button class="primary" data-on:click="@post('${base}/migrations/${encodeURIComponent(f.name)}/run')">Run</button>`
        : "";
      const viewBtn = `<button data-on:click="document.getElementById('migration-sql-dialog-title').textContent='${f.name.replace(/'/g, "\\'")}'; document.getElementById('migration-sql-dialog').showModal(); @get('${base}/migrations/${encodeURIComponent(f.name)}')">View</button>`;
      return `<tr><td class="migration-filename">${f.name}</td><td>${statusBadge}</td><td style="display:flex;gap:4px;justify-content:flex-end">${viewBtn}${runBtn}</td></tr>`;
    })
    .join("\n");

  return String(html`
    <div id="migrations-view">
      <style>
        ${styles}
      </style>
      ${dialog} ${sqlDialog}
      <div class="migrations-controls">
        ${raw(
          hasPending
            ? `<div class="ctrl-group"><button class="primary" data-on:click="@post('${base}/migrations/run-all')">Run all pending</button></div>`
            : "",
        )}
        <div class="ctrl-group">
          <button
            data-on:click="document.getElementById('migration-editor').showModal()"
          >
            New migration
          </button>
        </div>
      </div>
      <div class="migrations-container">
        <div class="migrations-card">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="migrations-list">
              ${raw(rows)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `);
}
