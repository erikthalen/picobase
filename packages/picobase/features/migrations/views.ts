import { html, raw } from "hono/html";
import type { MigrationFile } from "./queries.ts";

const css = String.raw;

const styles = css`
  #migrations-view {
  }
  .migrations-table {
    margin-bottom: 1.5rem;
  }
  .migration-filename {
    font-family: monospace;
    font-size: 0.8rem;
  }
  .migrations-controls {
    margin: 1rem;
  }
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
    margin-inline: 1rem;
  }
  .migrations-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
    gap: 0.75rem;
  }
  .migrations-empty-icon {
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

  if (files.length === 0) {
    return String(html`
      <div id="migrations-view">
        <style>
          ${styles}
        </style>
        ${dialog}
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
      return `<tr><td class="migration-filename">${f.name}</td><td>${statusBadge}</td><td>${runBtn}</td></tr>`;
    })
    .join("\n");

  return String(html`
    <div id="migrations-view">
      <style>
        ${styles}
      </style>

      <table class="migrations-table">
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

      <div class="migrations-controls">
        ${raw(
          hasPending
            ? `<button class="primary" data-on:click="@post('${base}/migrations/run-all')">Run all pending</button>`
            : "",
        )}
        ${dialog}
        <button
          class="new-migration-btn"
          data-on:click="document.getElementById('migration-editor').showModal()"
        >
          + New migration
        </button>
      </div>
    </div>
  `);
}
