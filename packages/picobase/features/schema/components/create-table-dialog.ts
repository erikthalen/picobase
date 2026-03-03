import { html } from "hono/html";

export function createTableDialog(base: string) {
  return html`
    <style>
      ${styles}
    </style>

    <button
      class="create-table-button"
      data-on:click="$_editTableDialog.showModal(); @get('${base}/schema/new-table-dialog')"
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
        class="icon icon-tabler icons-tabler-outline icon-tabler-table-plus"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M12.5 21h-7.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v7.5"
        />
        <path d="M3 10h18" />
        <path d="M10 3v18" />
        <path d="M16 19h6" />
        <path d="M19 16v6" />
      </svg>
      New Table
    </button>
  `;
}

const css = String.raw;

const styles = css`
  .create-table-button {
    background: var(--pb-bg);
  }

  .create-table-dialog {
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 8px;
    padding: 1.5rem;
    color: var(--pb-text);
  }
`;
