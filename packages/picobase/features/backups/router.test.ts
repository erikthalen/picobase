import { rmSync } from "node:fs";
import { Hono } from "hono";
import { afterAll, describe, expect, it } from "vitest";
import { createDb } from "../../db/client.ts";
import type { AppEnv } from "../../index.ts";
import { createBackupsRouter } from "./router.ts";

const backupsDir = "./tmp-backups-router-test";

afterAll(() => rmSync(backupsDir, { recursive: true, force: true }));

function makeApp() {
	const db = createDb(":memory:");
	const app = new Hono<AppEnv>();
	app.use("*", async (c, next) => {
		c.set("db", db);
		c.set("config", {
			database: ":memory:",
			basePath: "/",
			migrationsDir: "./m",
			backupsDir,
		});
		await next();
	});
	app.route("/backups", createBackupsRouter());
	return app;
}

describe("backups router", () => {
	it("GET /backups returns 200", async () => {
		const app = makeApp();
		const res = await app.request("/backups");
		expect(res.status).toBe(200);
		const body = await res.text();
		expect(body).toContain("Backups");
	});
});
