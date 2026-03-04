# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org) v22 or later
- A Hono server

## Installation

Install Picobase directly from GitHub:

```bash
pnpm add github:erikthalen/picobase
```

You'll also need Hono and the Node.js adapter if you don't have them already:

```bash
pnpm add hono @hono/node-server
```

## Adding Picobase to your server

Mount Picobase as a route on your existing Hono app:

```ts
import { serve } from "@hono/node-server";
import { definePicobase } from "@picobase/core";
import { Hono } from "hono";

const app = new Hono();

app.route("/pico", definePicobase({ database: "./my-app.db" }));

serve(app);
```

Open `http://localhost:3000` in your browser to access the GUI.

## Configuration

| Option          | Type     | Description                                  |
| --------------- | -------- | -------------------------------------------- |
| `database`      | `string` | Path to your `.db` or `.sqlite` file         |
| `migrationsDir` | `string` | Directory for `.sql` migration files         |
| `backupsDir`    | `string` | Directory where automatic backups are stored |
