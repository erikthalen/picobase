import { serve } from "@hono/node-server";
import { defineBabybase } from "@babybase/core";
import { Hono } from "hono";

const app = new Hono();
app.route("/", defineBabybase({ database: "./chinook.db" }));

serve({ fetch: app.fetch, port: 3002 }, () => {
  console.log("Babybase dev server: http://localhost:3002");
});
