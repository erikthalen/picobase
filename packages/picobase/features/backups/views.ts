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
    padding: 0.75rem;
    background: var(--pb-badge-fk-bg);
    border-radius: 6px;
    margin-bottom: 1rem;
    color: var(--pb-badge-fk-fg);
  }
`;

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export function backupsView(opts: {
  backups: BackupEntry[];
  basePath: string;
}): string {
  const { backups, basePath } = opts;
  const base = basePath.replace(/\/$/, "");

  const rows =
    backups.length === 0
      ? '<tr><td colspan="4" class="text-muted">No backups yet.</td></tr>'
      : backups
          .map((b) => {
            const label = b.createdAt.toLocaleString();
            return `<tr>
  <td class="backup-filename">${b.name}</td>
  <td>${label}</td>
  <td>${formatBytes(b.size)}</td>
  <td><button class="danger" data-on:click="$_restoreTarget='${b.name}'">Restore</button></td>
</tr>`;
          })
          .join("\n");

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
