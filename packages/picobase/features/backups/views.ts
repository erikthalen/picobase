import { html, raw } from "hono/html";
import type { BackupEntry } from "./queries.ts";

const css = String.raw;

const styles = css`
  #backups-view {
  }
  .backups-table {
    margin-bottom: 1.5rem;
  }
  .backup-filename {
    font-family: monospace;
    font-size: 0.8rem;
  }
  .create-backup-btn {
    margin-inline: 1rem;
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
  .backup-status-success {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 1rem 1.25rem;
    border: 1px solid var(--pb-border);
    border-radius: 8px;
    margin: 1rem;
    margin-bottom: 1.25rem;
  }
  .backup-status-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .backup-status-title {
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  .backup-status-body {
    font-size: 0.8rem;
    color: var(--pb-text-muted);
  }
  .backup-status-filename {
    font-family: monospace;
    color: var(--pb-text);
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
    cursor: pointer;
    color: var(--pb-text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-inline: 1rem;
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
`;

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function backupsListRows(backups: BackupEntry[], base: string): string {
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
  <td><button data-on:click="$_restoreTarget='${b.name}'">Restore</button></td>
  <td><button class="danger" data-on:click="@delete('${base}/backups/${encodeURIComponent(b.name)}')">Delete</button></td>
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

  const rows = backupsListRows(backups, base);

  return String(
    html`<div id="backups-view" data-signals="{_restoreTarget:''}">
      <style>
        ${styles}
      </style>
      <div id="backup-status"></div>
      <table class="backups-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Created</th>
            <th>Size</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody id="backups-list">
          ${raw(rows)}
        </tbody>
      </table>

      <button
        class="primary create-backup-btn"
        data-on:click="@post('${base}/backups')"
      >
        Create backup
      </button>

      <input
        type="file"
        id="upload-input"
        accept=".db,.sqlite"
        style="display:none"
      />
      <label
        for="upload-input"
        id="upload-zone"
        class="upload-zone"
        data-upload-url="${base}/backups/upload"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span class="upload-zone-title"
          >Drag &amp; drop a database file here</span
        >
        <span class="upload-zone-subtitle"
          >or click to select (.db, .sqlite)</span
        >
      </label>

      <script>
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
      </script>

      <div data-show="$_restoreTarget !== ''" class="restore-overlay">
        <div class="restore-backdrop">
          <div class="restore-modal">
            <h3 class="restore-modal-title">Restore database</h3>
            <p class="restore-modal-body">
              Restore from
              <span class="restore-filename" data-text="$_restoreTarget"></span
              >?
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
      </div>
    </div>`,
  );
}
