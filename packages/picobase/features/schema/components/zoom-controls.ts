import { html } from "hono/html";

const css = String.raw;

const styles = css`
  #zoom-controls {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--pb-surface);
    border: 1px solid var(--pb-border);
    border-radius: 8px;
    padding: 4px;
  }
  .zoom-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #zoom-level {
    min-width: 3rem;
    text-align: center;
    font-size: 0.75rem;
    color: var(--pb-text-muted);
    font-family: var(--pb-monospace);
  }
`;

export function zoomControls() {
  return html`
    <div id="zoom-controls">
      <style>
        ${styles}
      </style>
      <button class="zoom-btn" id="zoom-out">
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l14 0" />
        </svg>
      </button>
      <span id="zoom-level">100%</span>
      <button class="zoom-btn" id="zoom-in">
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
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 5l0 14" />
          <path d="M5 12l14 0" />
        </svg>
      </button>
    </div>
  `;
}
