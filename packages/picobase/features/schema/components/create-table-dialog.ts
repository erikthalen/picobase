import { html } from "hono/html";

export function createTableDialog(base: string) {
  return html`
    <button
      style="position:absolute;top:1rem;left:1rem;z-index:10;background:var(--pb-bg)"
      data-on:click="$createTableDialog.showModal()"
    >
      + New Table
    </button>

    <dialog
      data-ref="createTableDialog"
      closedby="any"
      style="left:50%;top:50%;translate:-50% -50%;background:var(--pb-surface);border:1px solid var(--pb-border);border-radius:8px;padding:1.5rem;color:var(--pb-text);"
    >
      <form>
        <label>
          Table name
          <input
            type="text"
            data-bind:_tableName
            placeholder="e.g. orders"
            autofocus
          />
        </label>
        <div>
          <button
            type="button"
            data-on:click="@post('${base}/schema/tables'); $createTableDialog.close(); _tableName = ''"
          >
            Create
          </button>
          <button
            type="button"
            data-on:click="$createTableDialog.close(); _tableName = ''"
          >
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  `;
}
