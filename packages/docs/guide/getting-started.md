# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org) v22 or later
- [pnpm](https://pnpm.io) v9 or later

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/erikthalen/picobase.git
cd picobase
pnpm install
```

## Running the dev server

```bash
pnpm dev
```

This starts the Picobase server at `http://localhost:3000`. Open it in your browser to access the GUI.

## Pointing at a database

By default Picobase opens the example database bundled in `packages/example`. To use your own SQLite file, pass the path as an environment variable:

```bash
DATABASE_PATH=./my-database.sqlite pnpm dev
```

## Project structure

```
packages/
  picobase/   # core server (Hono + node:sqlite)
  example/    # example database and seed data
  docs/       # this documentation site (VitePress)
```

## Building for production

```bash
pnpm build
pnpm start
```

The production build compiles the TypeScript source and starts the server in production mode.
