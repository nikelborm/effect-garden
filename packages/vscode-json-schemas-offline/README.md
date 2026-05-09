# JSON Schema Offline

Full offline JSON schema validation for VS Code, powered by the complete [SchemaStore](https://www.schemastore.org) catalog.

VS Code's built-in JSON validation fetches schemas on demand and doesn't cache them — so it breaks without internet access. This extension bundles **1125+ schemas** directly into the VSIX so validation works anywhere, even on an airplane.

## Features

- **Zero network requests at runtime** — all schemas are bundled at build time
- **Full SchemaStore coverage** — every schema from [schemastore.org](https://www.schemastore.org) plus external schemas referenced in the catalog
- **Automatic file matching** — 2400+ file-match rules covering `.json`, `.yaml`, `.yml`, `.toml` config files
- **Works with VS Code's built-in JSON Language Features** — no new UI, just schema suggestions and validation in the editor you already know

## How it works

The extension contributes all schemas via VS Code's [`contributes.jsonValidation`](https://code.visualstudio.com/api/references/contribution-points#contributes.jsonValidation) extension point. When you open a file whose name matches a known pattern (e.g. `package.json`, `.eslintrc.json`, `tsconfig.json`, `docker-compose.yml`), VS Code's built-in JSON/YAML language server picks up the bundled schema automatically — no configuration needed.

## Coverage

| Source | Count |
|--------|-------|
| SchemaStore catalog entries | 1270 |
| Schemas successfully bundled | 1125 |
| Skipped (dead/unreachable URLs) | 25 |
| File-match associations | 2432 |

Schemas come from two sources:
- **SchemaStore-hosted** schemas are copied from the [SchemaStore repository](https://github.com/SchemaStore/schemastore) at build time
- **Externally-hosted** schemas (e.g. from GitHub, project websites) are downloaded at build time and stored with Go-module-style path encoding (`schemas/<hostname>/<path>`)

## Rebuilding

If you want to update to a newer catalog:

```sh
cd schemastore && git pull && cd ..
bun run build
bun run package
```

## License

MIT
