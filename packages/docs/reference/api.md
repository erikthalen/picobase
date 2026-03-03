# API Reference

::: warning Work in progress
The API reference is being expanded. More endpoints will be documented here as the project stabilises.
:::

Picobase exposes a minimal HTTP API used by its own browser GUI. All responses are either HTML fragments (for SSE-driven rendering) or JSON.

## Base URL

```
http://localhost:3000
```

## Endpoints

### `GET /`

Returns the main application shell — a full HTML page that bootstraps the Datastar-powered UI.

### `GET /tables`

Returns an SSE stream that sends the list of tables in the current database as HTML fragments.

### `GET /tables/:name`

Returns an SSE stream with the schema and row data for the given table.
