import { mkdirSync, rmSync } from "node:fs";
import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../../db/client.ts";
import type { AppEnv } from "../../index.ts";
import { createMigrationsRouter } from "./router.ts";

const migrationsDir = "./tmp-migrations-router-test";

function makeApp() {
	const db = createDb(":memory:");
	const app = new Hono<AppEnv>();
	app.use("*", async (c, next) => {
		c.set("db", db);
		c.set("config", {
			database: ":memory:",
			basePath: "/",
			migrationsDir,
			backupsDir: "./b",
		});
		await next();
	});
	app.route("/migrations", createMigrationsRouter());
	return { app, db };
}

describe("migrations router", () => {
	beforeEach(() => {
		rmSync(migrationsDir, { recursive: true, force: true });
		mkdirSync(migrationsDir, { recursive: true });
	});

	it("GET /migrations returns 200", async () => {
		const { app } = makeApp();
		const res = await app.request("/migrations");
		expect(res.status).toBe(200);
		const body = await res.text();
		expect(body).toContain("Migrations");
	});
});
