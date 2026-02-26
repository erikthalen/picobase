import { Hono } from "hono";
import { layout, nav } from "../../components/layout.ts";
import { respond, sseAction } from "../../components/sse.ts";
import { listTables } from "../../db/schema-queries.ts";
import type { AppEnv } from "../../index.ts";
import { getFullSchema } from "./queries.ts";
import { colRowHtml, erDiagramView, schemaListView } from "./views.ts";

export function createSchemaRouter(): Hono<AppEnv> {
	const app = new Hono<AppEnv>();

	app.get("/", async (c) => {
		const db = c.get("db");
		const config = c.get("config");
		const base = config.basePath.replace(/\/$/, "");
		const tables = listTables(db);
		const schema = getFullSchema(db);
		const content = schemaListView(schema);
		const navHtml = nav({ basePath: base, activeSection: "schema", tables });
		return respond(c, {
			fullPage: () => layout({ title: "Schema", nav: navHtml, content }),
			fragment: () => `<main id="main">${content}</main>`,
		});
	});

	app.get("/diagram", async (c) => {
		const db = c.get("db");
		const config = c.get("config");
		const base = config.basePath.replace(/\/$/, "");
		const tables = listTables(db);
		const schema = getFullSchema(db);
		const content = erDiagramView(schema, base);
		const navHtml = nav({ basePath: base, activeSection: "schema", tables });
		return respond(c, {
			fullPage: () => layout({ title: "ER Diagram", nav: navHtml, content }),
			fragment: () => `<main id="main">${content}</main>`,
		});
	});

	// Append a new column row to the create-table dialog
	app.get("/new-col", (c) => {
		const config = c.get("config");
		const base = config.basePath.replace(/\/$/, "");
		const i = Number(c.req.query("i") ?? 0);
		return sseAction(c, async ({ patchElements }) => {
			await patchElements(colRowHtml(i, base), {
				mode: "append",
				selector: "#dialog-columns",
			});
		});
	});

	// Remove a column row from the create-table dialog
	app.delete("/new-col/:i", (c) => {
		const i = c.req.param("i");
		return sseAction(c, async ({ patchElements, patchSignals }) => {
			await patchElements(
				`<div id="new-col-${i}" data-swap-mode="delete"></div>`,
			);
			await patchSignals({
				[`col${i}name`]: null,
				[`col${i}type`]: null,
				[`col${i}dflt`]: null,
				[`col${i}pk`]: null,
			});
		});
	});

	app.post("/tables", async (c) => {
		const db = c.get("db");
		const config = c.get("config");
		const base = config.basePath.replace(/\/$/, "");
		let body: Record<string, unknown> = {};
		try {
			body = (await c.req.json()) as Record<string, unknown>;
		} catch {
			// malformed or missing body — treat as empty
		}
		const name = String(body.tableName ?? "").trim();
		if (name) {
			// Extract column definitions from colNname/colNtype/colNdflt/colNpk signals
			const colPattern = /^col(\d+)name$/;
			const indices = Object.keys(body)
				.filter((k) => colPattern.test(k))
				.map((k) => parseInt(k.match(colPattern)?.[1] ?? "", 10))
				.sort((a, b) => a - b);
			const columns = indices
				.map((i) => ({
					name: String(body[`col${i}name`] ?? "").trim(),
					type: String(body[`col${i}type`] ?? "TEXT"),
					dflt: String(body[`col${i}dflt`] ?? "").trim(),
					pk: body[`col${i}pk`] === true,
				}))
				.filter((col) => col.name);
			const colDefs =
				columns.length > 0
					? columns
							.map((col) => {
								let def = `${JSON.stringify(col.name)} ${col.type}`;
								if (col.pk) def += " PRIMARY KEY";
								if (col.dflt) def += ` DEFAULT ${col.dflt}`;
								return def;
							})
							.join(", ")
					: "id INTEGER PRIMARY KEY";
			db.exec(
				`CREATE TABLE IF NOT EXISTS ${JSON.stringify(name)} (${colDefs})`,
			);
		}
		const schema = getFullSchema(db);
		const content = erDiagramView(schema, base);
		return sseAction(c, async ({ patchElements }) => {
			await patchElements(`<main id="main">${content}</main>`);
		});
	});

	return app;
}
