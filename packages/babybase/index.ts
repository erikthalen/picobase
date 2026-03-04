import { dirname } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { Hono } from "hono";
import { createDb } from "./db/client.ts";
import { createMigrationsRouter } from "./features/migrations/router.ts";
import { createSchemaRouter } from "./features/schema/router.ts";
import { readSettings, writeSettings } from "./features/storage/queries.ts";
import { createStorageRouter } from "./features/storage/router.ts";
import { createTablesRouter } from "./features/tables/router.ts";
import type { BabybaseConfig } from "./types.ts";

export type AppEnv = {
  Variables: {
    db: DatabaseSync | null;
    config: {
      database: string | undefined;
      basePath: string;
      migrationsDir: string;
      storageDir: string;
    };
  };
};

export function defineBabybase(config: BabybaseConfig = {}): Hono<AppEnv> {
  const resolved: AppEnv["Variables"]["config"] = {
    database: config.database,
    basePath: config.basePath ?? "/",
    migrationsDir: config.migrationsDir ?? "./.babybase/migrations",
    storageDir: config.storageDir ?? "./.babybase/storage",
  };

  const originalDatabase = config.database;
  const babybaseDir = dirname(resolved.storageDir);

  // Override active database if a settings file exists from a previous mount
  const settings = readSettings(babybaseDir);
  if (settings.activeDatabase) {
    resolved.database = settings.activeDatabase;
  }

  let db: DatabaseSync | null = resolved.database ? createDb(resolved.database) : null;

  const mountDb = (newPath: string) => {
    try {
      db?.close();
    } catch {
      /* already closed */
    }
    resolved.database = newPath;
    db = createDb(newPath);
    writeSettings(babybaseDir, { activeDatabase: newPath });
  };

  const unmountDb = () => {
    try {
      db?.close();
    } catch {
      /* already closed */
    }
    db = null;
    resolved.database = originalDatabase;
    writeSettings(babybaseDir, {});
  };

  const app = new Hono<AppEnv>();

  // Inject db and config into every request
  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("config", resolved);
    await next();
  });

  // Redirect to /storage when no database is loaded
  app.use("*", async (c, next) => {
    if (db === null && !c.req.path.startsWith("/storage")) {
      return c.redirect(`${resolved.basePath.replace(/\/$/, "")}/storage`);
    }
    await next();
  });

  app.get("/", (c) => {
    const base = resolved.basePath.replace(/\/$/, "");
    return c.redirect(db === null ? `${base}/storage` : `${base}/schema`);
  });

  app.route("/tables", createTablesRouter());
  app.route("/schema", createSchemaRouter());
  app.route("/migrations", createMigrationsRouter());
  app.route("/storage", createStorageRouter({ originalDatabase, mountDb, unmountDb }));

  // Graceful shutdown handler
  function shutdown() {
    if (db) {
      console.log("Closing database...");
      try {
        db.close();
        console.log("Database closed.");
      } catch (err) {
        console.error("Error closing database:", err);
      }
    }
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return app;
}

export type { BabybaseConfig };
