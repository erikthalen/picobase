# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org) v22 or later

## Quickstart with the CLI

The fastest way to get started — no installation needed:

```bash
npx babybase ./my-database.db
```

Your browser will open automatically. See the [CLI guide](/guide/cli) for all options.

## Embedding in a Hono server

If you want Babybase alongside an existing app, install it as a dependency:

```bash
pnpm add github:erikthalen/babybase
pnpm add hono @hono/node-server
```

Then mount it as a route:

```ts
import { serve } from "@hono/node-server";
import { defineBabybase } from "@babybase/core";
import { Hono } from "hono";

const app = new Hono();

app.route("/baby", defineBabybase({ database: "./my-app.db" }));

serve(app);
```

Open `http://localhost:3000/baby` in your browser to access the GUI.

## Configuration

| Option          | Type     | Default                  | Description                                     |
| --------------- | -------- | ------------------------ | ----------------------------------------------- |
| `database`      | `string` | —                        | Path to your `.db` or `.sqlite` file (required) |
| `basePath`      | `string` | `"/"`                    | URL prefix when mounted at a sub-path           |
| `migrationsDir` | `string` | `./.babybase/migrations` | Directory for `.sql` migration files            |
| `storageDir`    | `string` | `./.babybase/storage`    | Directory where database backups are stored     |
