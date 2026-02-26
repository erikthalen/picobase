# ER Diagram Create Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "+ New Table" button to the ER diagram page that opens a native `<dialog>` where the user can enter a table name; on submit the table is created (with a single `id INTEGER PRIMARY KEY` column) and the ER diagram re-renders.

**Architecture:** The button and dialog are server-rendered HTML inside `erDiagramView`. Datastar handles opening the dialog (via `data-ref` + `showModal()`), binding the input signal, and posting to a new `POST /schema/tables` route. The server creates the table and streams back a patched ER diagram fragment via `sseAction`.

**Tech Stack:** Hono, Datastar (SSE + signals), `node:sqlite`, Vitest

---

### Task 1: Add `POST /schema/tables` route

**Files:**
- Modify: `packages/picobase/features/schema/router.ts`
- Test: `packages/picobase/features/schema/router.test.ts`

**Step 1: Write the failing test**

Add this test inside the existing `describe('schema router', ...)` block in `packages/picobase/features/schema/router.test.ts`:

```ts
it('POST /schema/tables creates a new table and returns SSE', async () => {
  const app = makeApp()
  const res = await app.request('/schema/tables', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _tableName: 'orders' }),
  })
  expect(res.status).toBe(200)
  const body = await res.text()
  // SSE response should contain the new table name in the patched HTML
  expect(body).toContain('orders')
})
```

**Step 2: Run the test to verify it fails**

```bash
cd packages/picobase && pnpm vitest run features/schema/router.test.ts
```

Expected: FAIL — `POST /schema/tables` returns 404.

**Step 3: Add the route to `packages/picobase/features/schema/router.ts`**

Add this import at the top (alongside existing imports):
```ts
import { listTables } from '../../db/schema-queries.ts'
```
*(already imported — no change needed)*

Add this route inside `createSchemaRouter()`, after the existing `app.get('/diagram', ...)` handler:

```ts
app.post('/tables', async (c) => {
  const db = c.get('db')
  const config = c.get('config')
  const base = config.basePath.replace(/\/$/, '')
  const body = (await c.req.json()) as Record<string, string>
  const name = (body._tableName ?? '').trim()
  if (name) {
    db.exec(`CREATE TABLE IF NOT EXISTS ${JSON.stringify(name)} (id INTEGER PRIMARY KEY)`)
  }
  const tables = listTables(db)
  const schema = getFullSchema(db)
  const content = erDiagramView(schema, base)
  const navHtml = nav({ basePath: base, activeSection: 'schema', tables })
  return sseAction(c, async ({ patchElements }) => {
    await patchElements(`<main id="main">${content}</main>`)
  })
})
```

**Step 4: Run the test to verify it passes**

```bash
cd packages/picobase && pnpm vitest run features/schema/router.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add packages/picobase/features/schema/router.ts packages/picobase/features/schema/router.test.ts
git commit -m "feat: add POST /schema/tables endpoint to create new table"
```

---

### Task 2: Add button and dialog to `erDiagramView`

**Files:**
- Modify: `packages/picobase/features/schema/views.ts`

The `erDiagramView` function (starting at line 167) currently returns:

```ts
return String(
  html`${header}
    <div id="schema-content" style="overflow:auto">
      <svg ...>...</svg>
    </div>`,
)
```

**Step 1: Replace the return block with the version that includes the button and dialog**

The `basePath` parameter is already available in `erDiagramView`. Replace the final `return String(...)` block (lines 554–566) with:

```ts
const base = basePath.replace(/\/$/, '')

return String(
  html`${header}
    <div
      data-signals="{_tableName: ''}"
      style="position:relative"
    >
      <button
        style="position:absolute;top:1rem;left:1rem;z-index:10"
        data-on:click="$refs.createTableDialog.showModal()"
      >
        + New Table
      </button>
      <div id="schema-content" style="overflow:auto">
        <svg
          width="${svgW}"
          height="${svgH}"
          xmlns="http://www.w3.org/2000/svg"
          style="background:var(--pb-diagram-bg);border-radius:8px;display:block;min-width: 100%;"
        >
          ${svgLines} ${svgBoxes} ${raw(dragScript)}
        </svg>
      </div>
      <dialog data-ref="createTableDialog">
        <form>
          <label>
            Table name
            <input
              type="text"
              data-bind:value="_tableName"
              placeholder="e.g. orders"
              autofocus
            />
          </label>
          <div>
            <button
              type="button"
              data-on:click="@post('${base}/schema/tables'); $refs.createTableDialog.close(); _tableName = ''"
            >
              Create
            </button>
            <button
              type="button"
              data-on:click="$refs.createTableDialog.close(); _tableName = ''"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </div>`,
)
```

Note: `base` was already computed as a local `const base = basePath.replace(/\/$/, '')` earlier in the function — double-check that it exists in the function scope (it doesn't today, so add `const base = basePath.replace(/\/$/, '')` at the top of `erDiagramView`).

**Step 2: Manually verify in the browser**

```bash
cd packages/example && pnpm dev
```

Open `http://localhost:3000/schema/diagram`:
- [ ] "+ New Table" button appears top-left of the diagram
- [ ] Clicking opens a modal dialog with a text input and Create/Cancel buttons
- [ ] Entering a name and clicking Create re-renders the diagram with the new table box
- [ ] Clicking Cancel closes the dialog without creating a table
- [ ] ESC key closes the dialog (native `<dialog>` behaviour)

**Step 3: Commit**

```bash
git add packages/picobase/features/schema/views.ts
git commit -m "feat: add create-table button and dialog to ER diagram"
```
