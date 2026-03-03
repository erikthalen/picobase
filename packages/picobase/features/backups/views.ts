import { html, raw } from "hono/html";
import type { BackupEntry } from "./queries.ts";

const css = String.raw;

const styles = css`
  #backups-view {
  }
  .backups-container {
    padding: 4.5rem 1.5rem 6rem;
    max-width: 780px;
    margin-inline: auto;
  }
  .backups-card {
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 12px;
    overflow: hidden;
  }
  .backups-controls {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .backups-controls .ctrl-group {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 10px;
    padding: 3px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .backups-controls .ctrl-group button {
    border: none;
    border-radius: 7px;
  }
  .backups-controls .ctrl-group button:hover {
    border-color: transparent;
  }
  .backups-card-footer {
    padding: 1rem;
    border-top: 1px solid var(--pb-border);
  }
  .backups-card-footer .upload-zone {
    margin: 0;
    max-width: none;
  }
  .backups-table {
  }
  .backup-filename {
    font-family: monospace;
    font-size: 0.8rem;
  }
  .restore-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
  }
  .restore-backdrop {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .restore-modal {
    background: var(--pb-surface);
    border-radius: 8px;
    padding: 1.5rem;
    width: 100%;
    max-width: 380px;
    box-shadow: var(--pb-shadow-sm);
  }
  .restore-modal-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .restore-modal-body {
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
    color: var(--pb-text-muted);
  }
  .restore-filename {
    font-family: monospace;
    color: inherit;
  }
  .restore-actions {
    display: flex;
    gap: 0.5rem;
  }
  .backup-actions-cell {
    justify-content: flex-end;
  }
  .backup-btn-group {
    display: flex;
    align-items: center;
    gap: 3px;
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 10px;
    padding: 3px;
  }
  .backup-btn-group button {
    border-color: transparent;
    border-radius: 7px;
  }
  .backup-btn-group button:hover,
  .backup-btn-group button.danger:hover {
    border-color: transparent;
  }
  .backup-btn-group button + button {
    position: relative;
  }
  .backup-btn-group button + button::before {
    content: "";
    position: absolute;
    left: -3px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--pb-border);
  }
  .upload-badge {
    font-size: 0.65rem;
    padding: 1px 5px;
    border-radius: 3px;
    background: var(--pb-badge-pk-bg);
    color: var(--pb-badge-pk-fg);
    vertical-align: middle;
    margin-left: 4px;
  }
  .upload-zone {
    border: 2px dashed var(--pb-border);
    border-radius: 8px;
    padding: 2.5rem 1rem;
    text-align: center;
    max-width: 400px;
    cursor: pointer;
    color: var(--pb-text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-inline: auto;
    margin-top: 2rem;
    user-select: none;
    transition:
      border-color 0.15s,
      background-color 0.15s;
  }
  .upload-zone:hover,
  .upload-zone.drag-over {
    border-color: var(--pb-text-muted);
    background-color: var(--pb-bg);
  }
  .upload-zone.uploading {
    opacity: 0.6;
    cursor: wait;
    pointer-events: none;
  }
  .upload-zone-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--pb-text);
  }
  .upload-zone-subtitle {
    font-size: 0.8rem;
  }
  .backups-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem 25vh;
    text-align: center;
    gap: 1.5rem;
    height: 100vh;
  }
  .backups-empty-dropzone {
    border: 2px dashed var(--pb-border);
    border-radius: 12px;
    padding: 3rem 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;
    transition:
      border-color 0.15s,
      background-color 0.15s;
    max-width: 400px;
    width: 100%;
  }
  .backups-empty-dropzone:hover,
  .backups-empty-dropzone.drag-over {
    border-color: var(--pb-text-muted);
    background-color: var(--pb-bg);
  }
  .backups-empty-dropzone.uploading {
    opacity: 0.6;
    cursor: wait;
    pointer-events: none;
  }
  .backups-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pb-text-faint);
    margin-bottom: 0.5rem;
  }
  .backups-empty-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
  .backups-empty-body {
    font-size: 0.875rem;
    color: var(--pb-text-muted);
    max-width: 300px;
    margin: 0;
    line-height: 1.5;
  }
  .backups-empty-hint {
    font-size: 0.8rem;
    color: var(--pb-text-faint);
  }
  .delete-confirm-dialog {
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 8px;
    padding: 1.5rem;
    color: inherit;
    width: 90%;
    max-width: 420px;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
  }
  .delete-confirm-dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  .delete-confirm-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  .delete-confirm-body {
    font-size: 0.875rem;
    color: var(--pb-text-muted);
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }
  .delete-confirm-name {
    font-family: var(--pb-monospace);
    font-size: 0.8rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--pb-border);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    display: block;
    margin-bottom: 1rem;
    word-break: break-all;
  }
  .delete-confirm-label {
    display: block;
    font-size: 0.8rem;
    color: var(--pb-text-muted);
    margin-bottom: 0.35rem;
  }
  .delete-confirm-dialog input {
    width: 100%;
  }
  .delete-confirm-actions {
    display: flex;
    justify-content: end;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }
`;

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function backupsListRows(backups: BackupEntry[]): string {
  if (backups.length === 0) {
    return '<tr><td colspan="5" class="text-muted">No backups yet.</td></tr>';
  }
  return backups
    .map((b) => {
      const label = b.createdAt.toLocaleString();
      const badge =
        b.type === "upload" ? '<span class="upload-badge">upload</span>' : "";
      return `<tr>
  <td class="backup-filename">${b.name}${badge}</td>
  <td>${label}</td>
  <td>${formatBytes(b.size)}</td>
  <td class="backup-actions-cell"><div class="backup-btn-group"><button data-on:click="$_restoreTarget='${b.name}'">Restore</button><button class="danger" data-on:click="$_deleteTarget='${b.name}'; $_deleteConfirm=''; document.getElementById('delete-confirm-dialog').showModal()">Delete</button></div></td>
</tr>`;
    })
    .join("\n");
}

export function backupsView(opts: {
  backups: BackupEntry[];
  basePath: string;
}): string {
  const { backups, basePath } = opts;
  const base = basePath.replace(/\/$/, "");

  const uploadInput = html`<input
    type="file"
    id="upload-input"
    accept=".db,.sqlite"
    style="display:none"
  />`;

  const uploadScript = html`<script>
    (function () {
      var zone = document.getElementById("upload-zone");
      var input = document.getElementById("upload-input");
      if (!zone || !input) return;
      var url = zone.dataset.uploadUrl;
      zone.addEventListener("dragover", function (e) {
        e.preventDefault();
        zone.classList.add("drag-over");
      });
      zone.addEventListener("dragleave", function () {
        zone.classList.remove("drag-over");
      });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.classList.remove("drag-over");
        var file = e.dataTransfer && e.dataTransfer.files[0];
        if (file) doUpload(file);
      });
      input.addEventListener("change", function () {
        if (input.files && input.files[0]) doUpload(input.files[0]);
      });
      function doUpload(file) {
        var fd = new FormData();
        fd.append("file", file);
        zone.classList.add("uploading");
        fetch(url, { method: "POST", body: fd })
          .then(function (r) {
            if (r.ok) window.location.reload();
          })
          .catch(function () {})
          .finally(function () {
            zone.classList.remove("uploading");
          });
      }
    })();
  </script>`;

  const deleteDialog = html`<dialog
    id="delete-confirm-dialog"
    class="delete-confirm-dialog"
    closedby="any"
  >
    <h3 class="delete-confirm-title">Delete backup</h3>
    <p class="delete-confirm-body">
      This action cannot be undone. Type the filename to confirm:
    </p>
    <code class="delete-confirm-name" data-text="$_deleteTarget"></code>
    <span class="delete-confirm-label">Filename</span>
    <input
      data-bind:_delete-confirm
      data-attr:placeholder="$_deleteTarget"
      autocomplete="off"
      spellcheck="false"
    />
    <div class="delete-confirm-actions">
      <form method="dialog">
        <button type="submit" data-on:click="$_deleteConfirm=''">Cancel</button>
      </form>
      <button
        class="danger"
        data-attr:disabled="$_deleteConfirm !== $_deleteTarget"
        data-on:click="@delete('${base}/backups/' + $_deleteTarget); $_deleteTarget=''; $_deleteConfirm=''; document.getElementById('delete-confirm-dialog').close()"
      >
        Delete
      </button>
    </div>
  </dialog>`;

  const restoreModal = html`<div
    data-show="$_restoreTarget !== ''"
    class="restore-overlay"
  >
    <div class="restore-backdrop">
      <div class="restore-modal">
        <h3 class="restore-modal-title">Restore database</h3>
        <p class="restore-modal-body">
          Restore from
          <span class="restore-filename" data-text="$_restoreTarget"></span>?
        </p>
        <div class="restore-actions">
          <button
            class="primary"
            data-on:click="@post('${base}/backups/' + $_restoreTarget + '/restore?backup=true'); $_restoreTarget=''"
          >
            Backup &amp; Restore
          </button>
          <button
            data-on:click="@post('${base}/backups/' + $_restoreTarget + '/restore?backup=false'); $_restoreTarget=''"
          >
            Restore
          </button>
          <button data-on:click="$_restoreTarget=''">Cancel</button>
        </div>
      </div>
    </div>
  </div>`;

  if (backups.length === 0) {
    return String(
      html`<div
        id="backups-view"
        data-signals="{_restoreTarget:'', _deleteTarget:'', _deleteConfirm:''}"
      >
        <style>
          ${raw(styles)}
        </style>
        ${uploadInput}
        <div class="backups-empty">
          <label
            for="upload-input"
            id="upload-zone"
            class="backups-empty-dropzone"
            data-upload-url="${base}/backups/upload"
          >
            <div class="backups-empty-icon">
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
                class="icon icon-tabler icons-tabler-outline icon-tabler-upload"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                <path d="M7 9l5 -5l5 5" />
                <path d="M12 4l0 12" />
              </svg>
            </div>
            <h3 class="backups-empty-title">No backups yet</h3>
            <p class="backups-empty-body">
              Drop a SQLite database file here to upload it as a backup.
            </p>
            <span class="backups-empty-hint"
              >Accepts .db and .sqlite · click to browse</span
            >
          </label>
          <button
            class="primary create-backup-btn"
            data-on:click="@post('${base}/backups')"
          >
            Create backup
          </button>
        </div>
        ${uploadScript} ${deleteDialog} ${restoreModal}
      </div>`,
    );
  }

  const rows = backupsListRows(backups);

  return String(
    html`<div
      id="backups-view"
      data-signals="{_restoreTarget:'', _deleteTarget:'', _deleteConfirm:''}"
    >
      <style>
        ${raw(styles)}
      </style>
      <div class="backups-controls">
        <div class="ctrl-group">
          <button
            class="primary"
            data-on:click="@post('${base}/backups')"
          >
            Create backup
          </button>
        </div>
      </div>
      <div class="backups-container">
        <div class="backups-card">
          <table class="backups-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Created</th>
                <th>Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="backups-list">
              ${raw(rows)}
            </tbody>
          </table>
          <div class="backups-card-footer">
            ${uploadInput}
            <label
              for="upload-input"
              id="upload-zone"
              class="upload-zone"
              data-upload-url="${base}/backups/upload"
            >
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
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                <path d="M7 9l5 -5l5 5" />
                <path d="M12 4l0 12" />
              </svg>
              <span class="upload-zone-title"
                >Drag &amp; drop a database file here</span
              >
              <span class="upload-zone-subtitle"
                >or click to select (.db, .sqlite)</span
              >
            </label>
          </div>
        </div>
      </div>

      ${uploadScript} ${deleteDialog} ${restoreModal}
    </div>`,
  );
}
