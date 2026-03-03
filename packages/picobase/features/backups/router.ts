import { Hono } from "hono";
import { layout, nav } from "../../components/layout.ts";
import { respond, sseAction } from "../../components/sse.ts";
import { listTables } from "../../db/schema-queries.ts";
import type { AppEnv } from "../../index.ts";
import {
  createBackup,
  deleteBackup,
  listBackups,
  restoreBackup,
  saveUploadedDb,
} from "./queries.ts";
import { backupsListRows, backupsView } from "./views.ts";
import { html } from "hono/html";

const CHECK_ICON = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="icon icon-tabler icons-tabler-outline icon-tabler-check"
>
  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
  <path d="M5 12l5 5l10 -10" />
</svg>`;

function statusHtml(title: string, body: string): string {
  return `<div id="backup-status" class="backup-status-success"><span class="backup-status-icon">${CHECK_ICON}</span><div><div class="backup-status-title">${title}</div><div class="backup-status-body">${body}</div></div></div>`;
}

export function createBackupsRouter(reconnectDb: () => void): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.get("/", async (c) => {
    const db = c.get("db");
    const config = c.get("config");
    const base = config.basePath.replace(/\/$/, "");
    const tables = listTables(db);
    const backups = listBackups(config.backupsDir);
    const content = backupsView({ backups, basePath: base });
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
    const backups = listBackups(config.backupsDir);
    return sseAction(c, async ({ patchElements }) => {
      await patchElements(
        `<main id="main">${backupsView({ backups, basePath: base })}</main>`,
      );
      await patchElements(
        statusHtml(
          "Backup created",
          `Saved as <span class="backup-status-filename">${backupName}</span>.`,
        ),
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
    const backups = listBackups(config.backupsDir);
    return sseAction(c, async ({ patchElements }) => {
      await patchElements(`<tbody id="backups-list">${backupsListRows(backups, base)}</tbody>`);
    });
  });

  // Restore from a backup — static route before parameterized (none here, but good practice)
  app.post("/:name/restore", async (c) => {
    const db = c.get("db");
    const config = c.get("config");
    const name = decodeURIComponent(c.req.param("name"));
    const base = config.basePath.replace(/\/$/, "");
    const backup = c.req.query("backup") !== "false";
    try {
      db.close();
    } catch {
      /* already closed or errored */
    }
    const safetyName = restoreBackup(
      config.database,
      config.backupsDir,
      name,
      backup,
    );
    reconnectDb();
    const backups = listBackups(config.backupsDir);
    const body = safetyName
      ? `Restored from <span class="backup-status-filename">${name}</span>. A safety backup was saved as <span class="backup-status-filename">${safetyName}</span>.`
      : `Restored from <span class="backup-status-filename">${name}</span>.`;
    return sseAction(c, async ({ patchElements }) => {
      await patchElements(
        `<main id="main">${backupsView({ backups, basePath: base })}</main>`,
      );
      await patchElements(statusHtml("Database restored", body));
    });
  });

  return app;
}
