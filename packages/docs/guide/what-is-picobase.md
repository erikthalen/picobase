# What is Picobase?

Picobase is a lightweight, self-hosted SQLite database manager with a browser-based GUI. It lets you inspect and manage SQLite databases through a clean interface without any cloud dependency or complex setup.

Think of it as a local-first alternative to Supabase — purpose-built for SQLite files on your own machine.

## Use cases

- **Local development** — inspect your app's database during development without external tooling
- **Prototyping** — quickly browse and edit data as you build
- **Data exploration** — load any `.sqlite` file and browse its contents immediately

## How it works

Picobase starts a small HTTP server (powered by [Hono](https://hono.dev)) that serves a browser UI. The UI communicates with the server over [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) using [Datastar](https://data-star.dev) — there is no separate API or client-side framework.

All HTML is server-rendered. Interactivity is driven entirely by server-sent signals, keeping the client footprint minimal.

## What it is not

Picobase is **not** a production database platform. It does not handle authentication, access control, or multi-user environments. It is a developer tool for local use.

## Next steps

- [Getting Started](/guide/getting-started) — install and run Picobase against your own SQLite file
