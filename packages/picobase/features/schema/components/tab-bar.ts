import { html } from "hono/html";

export function tabBar() {
  return html`
    <nav id="table-tabs" class="tab-bar">
      <a href="/schema">Diagram</a>
      <a href="/schema/table">Table</a>
    </nav>
  `;
}
