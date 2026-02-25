import { Hono } from "hono"
import type { PicobaseConfig } from "./types.js"

export function definePicobase(_config: PicobaseConfig): Hono {
  const app = new Hono()
  app.get("/", (c) => c.text("Picobase OK"))
  return app
}

export type { PicobaseConfig }
