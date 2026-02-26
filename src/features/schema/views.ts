import { html, raw } from "hono/html";
import type { TableSchema } from "./queries.ts";

export function schemaListView(
  schema: TableSchema[],
  basePath: string,
): string {
  const base = basePath.replace(/\/$/, "");
  const tables = schema
    .map((t) => {
      const cols = t.columns
        .map((c) => {
          const fkBadge = t.foreignKeys.some((fk) => fk.from === c.name)
            ? '<span class="badge fk">FK</span> '
            : "";
          const pkBadge = c.pk ? '<span class="badge pk">PK</span> ' : "";
          const nnBadge =
            c.notnull && !c.pk ? '<span class="badge">NN</span> ' : "";
          const dflt =
            c.dflt_value != null
              ? `<span class="text-faint">${String(c.dflt_value)}</span>`
              : "";
          return `<tr><td>${c.name}</td><td class="text-muted">${c.type || "ANY"}</td><td>${pkBadge}${fkBadge}${nnBadge}</td><td>${dflt}</td></tr>`;
        })
        .join("\n");
      return `<div style="margin-bottom:2rem">
  <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">${t.name}</h3>
  <table>
    <thead><tr><th>Column</th><th>Type</th><th>Flags</th><th>Default</th></tr></thead>
    <tbody>${cols}</tbody>
  </table>
</div>`;
    })
    .join("\n");

  return String(
    html`<div
        style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem"
      >
        <h2>Schema</h2>
        <a href="/schema/diagram">ER Diagram →</a>
      </div>
      <div id="schema-content">${raw(tables)}</div>`,
  );
}

export function erDiagramView(schema: TableSchema[], basePath: string): string {
  const base = basePath.replace(/\/$/, "");
  const BOX_W = 200;
  const ROW_H = 36;
  const BOX_HEADER_H = 32;
  const COL_GAP = 80;
  const ROW_GAP = 60;
  const COLS = Math.max(1, Math.ceil(Math.sqrt(schema.length)));
  const PAD = 40;

  // Compute box heights and positions
  const boxes = schema.map((t, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const h = BOX_HEADER_H + t.columns.length * ROW_H + 8;
    return { t, col, row, h };
  });

  // Row y offsets: each row starts after tallest box in previous row
  const rowYOffsets: number[] = [];
  const numRows = Math.ceil(schema.length / COLS);
  let y = PAD;
  for (let r = 0; r < numRows; r++) {
    rowYOffsets[r] = y;
    const rowBoxes = boxes.filter((b) => b.row === r);
    const maxH = Math.max(...rowBoxes.map((b) => b.h));
    y += maxH + ROW_GAP;
  }

  const positions: Record<string, { x: number; y: number; h: number }> = {};
  boxes.forEach(({ t, col, row, h }) => {
    positions[t.name] = {
      x: PAD + col * (BOX_W + COL_GAP),
      y: rowYOffsets[row] ?? PAD,
      h,
    };
  });

  const svgW = PAD * 2 + COLS * BOX_W + (COLS - 1) * COL_GAP;
  const svgH = y;

  const svgBoxes = schema
    .map((t) => {
      const pos = positions[t.name]!;
      const colRows = t.columns
        .map((c, ci) => {
          const pk = c.pk ? "🔑  " : "";
          const fk = t.foreignKeys.some((fk) => fk.from === c.name) ? "⤷ " : "";

          return html`
            ${ci % 2 === 1
              ? html`<rect
                  x="${pos.x + 1}"
                  y="${pos.y + BOX_HEADER_H + ci * ROW_H}"
                  width="${BOX_W - 2}"
                  height="${ROW_H}"
                  style="fill:var(--pb-diagram-row-alt)"
                />`
              : ""}
            <text
              x="${pos.x + 10}"
              y="${pos.y + BOX_HEADER_H + 14 + ci * ROW_H + 7}"
              font-size="11"
              style="fill:var(--pb-text-heading)"
            >
              ${pk}${fk}${c.name}
              ${c.dflt_value ? `= ${String(c.dflt_value)}` : ""}
            </text>

            <text
              x="${pos.x + BOX_W - 10}"
              y="${pos.y + BOX_HEADER_H + 14 + ci * ROW_H + 8}"
              font-size="10"
              style="fill:var(--pb-text-faint)"
              font-family="monospace"
              text-anchor="end"
            >
              ${c.type || "ANY"}
            </text>
          `;
        })
        .join("\n");

      return `<rect x="${pos.x}" y="${pos.y}" width="${BOX_W}" height="${pos.h}" rx="8" style="fill:var(--pb-surface);stroke:var(--pb-border)" stroke-width="1"/>
<rect x="${pos.x}" y="${pos.y}" width="${BOX_W}" height="${BOX_HEADER_H}" rx="8" style="fill:var(--pb-diagram-header)"/>
<rect x="${pos.x}" y="${pos.y + BOX_HEADER_H - 6}" width="${BOX_W}" height="6" style="fill:var(--pb-diagram-header)"/>
<text x="${pos.x + 16}" y="${pos.y + 21}" font-size="13" font-weight="600" style="fill:var(--pb-diagram-title)">${t.name}</text>
${colRows}`;
    })
    .join("\n");

  const svgLines = schema
    .flatMap((t) =>
      t.foreignKeys.map((fk) => {
        const from = positions[t.name];
        const to = positions[fk.table];
        if (!from || !to) return "";
        const fromColIdx = t.columns.findIndex((c) => c.name === fk.from);
        const targetSchema = schema.find((s) => s.name === fk.table);
        const toColIdx =
          targetSchema?.columns.findIndex((c) => c.name === fk.to) ?? 0;
        if (fromColIdx === -1) return "";
        const x1 = from.x + BOX_W;
        const y1 = from.y + BOX_HEADER_H + fromColIdx * ROW_H + ROW_H / 2;
        const x2 = to.x;
        const y2 =
          to.y +
          BOX_HEADER_H +
          (toColIdx === -1 ? 0 : toColIdx) * ROW_H +
          ROW_H / 2;
        const mx = (x1 + x2) / 2;
        return html`<path
          d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"
          fill="none"
          style="stroke:var(--pb-diagram-relation)"
          stroke-width="1.5"
          stroke-dasharray="5,3"
        >
          <!-- marker-end="url(#arrow)" -->
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-8"
            dur="1.2s"
            repeatCount="indefinite"
        /></path>`;
      }),
    )
    .join("\n");

  const arrowDef = html`<defs>
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" style="fill:var(--pb-diagram-relation)" />
    </marker>
  </defs>`;

  return String(
    html`<div
        style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem"
      >
        <h2>ER Diagram</h2>
        <a href="/schema">← Column List</a>
      </div>
      <div id="schema-content" style="overflow:auto">
        <svg
          width="${svgW}"
          height="${svgH}"
          xmlns="http://www.w3.org/2000/svg"
          style="background:var(--pb-diagram-bg);border-radius:8px;display:block"
        >
          ${raw(arrowDef)} ${raw(svgBoxes)} ${raw(svgLines)}
        </svg>
      </div>`,
  );
}
