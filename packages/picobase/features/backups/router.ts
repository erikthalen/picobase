import { statSync } from "node:fs";
import { basename, join } from "node:path";
import { Hono } from "hono";
import { layout, nav, toastHtml } from "../../components/layout.ts";
import { respond, sseAction } from "../../components/sse.ts";
import { listTables } from "../../db/schema-queries.ts";
import type { AppEnv } from "../../index.ts";
import {
  createBackup,
  deleteBackup,
  listBackups,
  saveUploadedDb,
  type BackupEntry,
} from "./queries.ts";
import { backupsListRows, backupsView } from "./views.ts";

function makeOriginalEntry(dbPath: string): BackupEntry {
  let size = 0;
  let createdAt = new Date(0);
  try {
    const stat = statSync(dbPath);
    size = stat.size;
    createdAt = stat.birthtime;
  } catch {
    /* file may not exist yet */
  }
  return { name: basename(dbPath), path: dbPath, size, createdAt, type: "original" };
}

export function createBackupsRouter(opts: {
  originalDatabase: string;
  mountDb: (path: string) => void;
}): Hono<AppEnv> {
  const { originalDatabase, mountDb } = opts;
  const app = new Hono<AppEnv>();

  app.get("/", async (c) => {
    const db = c.get("db");
    const config = c.get("config");
    const base = config.basePath.replace(/\/$/, "");
    const tables = listTables(db);
    const backups = [makeOriginalEntry(originalDatabase), ...listBackups(config.backupsDir)];
    const content = backupsView({ backups, basePath: base, activeDatabase: config.database });
    const navHtml = nav({ basePath: base, activeSection: "backups", tables });
    return respond(c, {
      fullPage: () => layout({ title: "Backups", nav: navHtml, content }),
      fragment: () => `<main id="main">${content}</main>`,
    });
  });

  // Create a new backup
  app.post("/", async (c) => {
    const config = c.get("config");
    const base = config.basePath.replace(/\/$/, "");
    const backupName = createBackup(config.database, config.backupsDir);
    const backups = [makeOriginalEntry(originalDatabase), ...listBackups(config.backupsDir)];
    return sseAction(c, async ({ patchElements }) => {
      await patchElements(
        `<main id="main">${backupsView({ backups, basePath: base, activeDatabase: config.database })}</main>`,
      );
      await patchElements(
        toastHtml("Backup created", `Saved as <code>${backupName}</code>.`),
        { selector: "#toast-container", mode: "append" },
      );
    });
  });

  // Upload an external database file
  app.post("/upload", async (c) => {
    const config = c.get("config");
    try {
      const body = await c.req.parseBody();
      const file = body.file;
      if (file instanceof File && file.size > 0) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const data = Buffer.from(await file.arrayBuffer());
        saveUploadedDb(config.backupsDir, safe, data);
      }
    } catch {
      // ignore upload errors
    }
    return c.json({ ok: true });
  });

  // Delete a backup or uploaded file
  app.delete("/:name", async (c) => {
    const config = c.get("config");
    const base = config.basePath.replace(/\/$/, "");
    const name = decodeURIComponent(c.req.param("name"));
    try {
      deleteBackup(config.backupsDir, name);
    } catch {
      // file already gone
    }
    const backups = [makeOriginalEntry(originalDatabase), ...listBackups(config.backupsDir)];
    return sseAction(c, async ({ patchElements }) => {
      await patchElements(
        `<tbody id="backups-list">${backupsListRows(backups, base, config.database)}</tbody>`,
      );
    });
  });

  // Mount a database file as the active database
  app.post("/:name/mount", async (c) => {
    const config = c.get("config");
    const base = config.basePath.replace(/\/$/, "");
    const name = decodeURIComponent(c.req.param("name"));
    const newPath = name === "~original"
      ? originalDatabase
      : join(config.backupsDir, name);
    mountDb(newPath);
    const backups = [makeOriginalEntry(originalDatabase), ...listBackups(config.backupsDir)];
    return sseAction(c, async ({ patchElements }) => {
      await patchElements(
        `<main id="main">${backupsView({ backups, basePath: base, activeDatabase: config.database })}</main>`,
      );
      await patchElements(
        toastHtml("Database mounted", `Now using <code>${basename(newPath)}</code>.`),
        { selector: "#toast-container", mode: "append" },
      );
    });
  });

  return app;
}
