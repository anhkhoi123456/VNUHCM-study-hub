# StudyHub backend (MVP)

Express + [`mssql`](https://www.npmjs.com/package/mssql) API on SQL Server. It also serves the frontend, so the site and the API share one origin (`http://localhost:3000`) and no CORS is needed in practice.

Scope: read-only catalog and documents. Planner, chatbot, login and upload are not implemented (the `USERS` and `SAVED_DOCUMENT` tables exist but nothing uses them yet).

## Quick start

Requirements: Node.js 22+ (see `.nvmrc`; `nvm use`), and either Docker or a SQL Server you can reach.

```sh
cd Backend
cp .env.example .env          # then set DB_PASSWORD (SQL Server needs a strong one)
npm install
docker compose up -d          # SQL Server 2022 on localhost:1433 (see "SQL Server" below)
npm run migrate               # creates the VNUHCM database and applies the schema
npm run seed                  # loads the sample data
npm start                     # http://localhost:3000
```

Open <http://localhost:3000/> (redirects to the frontend) or `http://localhost:3000/Frontend/file.html?document=ctdl-master&course=ctdl`.

Wait ~15 s after `docker compose up` before migrating; SQL Server needs time to start (`docker compose logs sqlserver` shows "ready for client connections").

### SQL Server

**Docker (recommended).** `docker-compose.yml` runs `mcr.microsoft.com/mssql/server:2022-latest` with a named volume, using `DB_PASSWORD` and `DB_PORT` from `.env`. Stop with `docker compose down` (data is kept; add `-v` to wipe it).

**Apple Silicon (M1/M2/M3...).** The SQL Server image is x86-64 only. Enable Rosetta in Docker Desktop: *Settings → General → "Use Rosetta for x86_64/amd64 emulation on Apple Silicon"*. `docker-compose.yml` already sets `platform: linux/amd64`. Expect a slower start; if the container exits right away, check that Rosetta is enabled and give Docker at least 4 GB of memory.

**Existing/native SQL Server** (Windows, Linux, Azure SQL Edge is not tested): point `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env` at it. The login needs permission to create the `VNUHCM` database. Skip `docker compose`. `DB_NAME` must stay `VNUHCM` because `database/structure.sql` hard-codes that name.

### Configuration (`.env`, never committed)

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `production` restricts CORS to `CORS_ORIGIN` |
| `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `1433`, `VNUHCM`, `sa`, – | SQL Server connection |
| `DB_ENCRYPT`, `DB_TRUST_SERVER_CERT` | `false`, `true` | TLS settings (the container uses a self-signed certificate) |
| `CORS_ORIGIN` | empty | Comma-separated extra origins allowed outside development |

## Database

- `database/structure.sql` is the original schema and is left untouched. It becomes migration `000_structure.sql`.
- `database/migrations/NNN_*.sql` extend it (names, metadata, `DOCUMENT`, `USERS`, `SAVED_DOCUMENT`). Nothing is dropped; new columns on old tables are nullable. Files are split on `GO` lines.
- `npm run migrate` applies pending files in order and records them in `dbo.SCHEMA_MIGRATIONS`, so it is safe to re-run. If a database was created from `structure.sql` by hand, the baseline is recorded without re-running it.
- `database/seeds/*.sql` use `MERGE`, so `npm run seed` is also safe to re-run. It never resets `DOCUMENT.VIEWS`.

Seed data mirrors `Frontend/js/data/`: 8 universities; under UIT 6 faculties; under *Hệ thống thông tin* 3 majors; under *HTTT (CTTT)* the 6 sample courses; under `ctdl` the documents `ctdl-master` and `ctdl-slides`. Faculty/major IDs (`httt`, `httt-cttt`, ...) are slugs invented for the seed because the frontend sample data has none.

`DOCUMENT.SIZE_BYTES` stores the size in bytes; the API formats it (`"12.4 MB"`). `FILE_PATH`/`PREVIEW_PATH` are relative to `Backend/storage/`.

### Placeholder files

`storage/samples/` contains **generated placeholder files, not real course material**: `ctdl-master.pdf`, `ctdl-slides.pptx` and its PDF preview `ctdl-slides.pdf` (each page says so). Their sizes in the seed are the placeholders' real sizes, so the UI shows e.g. "2.9 KB", not the "12.4 MB" of the frontend sample. To use real files, put them under `storage/`, then update `FILE_PATH`, `PREVIEW_PATH`, `SIZE_BYTES` (and `MIME_TYPE`) of the rows, e.g. by editing `database/seeds/001_sample.sql` and re-running `npm run seed`.

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/documents/:id` | Metadata in the shape documented in `Frontend/README.md`. Counts one view. |
| `GET /api/documents/:id/content` | The original file. PDF: `Content-Type: application/pdf`, `Content-Disposition: inline`. Other types: their own MIME type as an attachment. |
| `GET /api/documents/:id/preview` | PDF representation of an Office file (what the frontend iframe shows for `previewUrl`). 404 if none. |
| `GET /api/catalog` | `{ universities: [{ id, name, logoUrl, faculties: [{ ..., majors: [{ ..., courses: [{ id, name, semester, type, lecturer, updated, color, documentCount, formats }] }] }] }] }` |
| `GET /api/courses/:id/documents` | `{ id, title, lecturer, updated, documents: [...] }` with the same document shape as above. |
| `GET /api/health` | `{ "ok": true }` |

Errors are JSON: `{ "error": "Not found" }` (404) or `{ "error": "Internal server error" }` (500; details only go to the server log). Ids must match `[A-Za-z0-9_-]{1,50}`. File paths from the database are resolved inside `storage/` and anything escaping it is a 404.

### Same-origin static serving and CSP

Only `/`, `/Frontend/*` and `/resources/*` are served, so URLs match serving the repository root. This is an allowlist on purpose: serving the whole root would expose `Backend/.env`, the source and `.git`.

Security headers come from `helmet`, with a custom Content-Security-Policy because the default one would break the frontend (inline theme `<script>` in every `<head>`, Font Awesome from `cdnjs.cloudflare.com`, Google Fonts from `fonts.googleapis.com` / `fonts.gstatic.com`). It allows `'unsafe-inline'` scripts/styles, those three hosts, `https:` images, and same-origin frames (the PDF iframe). `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'` let the iframe load `/content`. Tightening this means moving the inline scripts into files first.

CORS: in development any origin is reflected (with credentials); otherwise only `CORS_ORIGIN`.

## Tests

```sh
npm test                       # 19 tests, no database needed (fake repository)
RUN_DB_TESTS=1 npm test        # + integration test against the migrated and seeded database
```

Covered: the documents contract, inline PDF vs. attachment, preview, 404s and path traversal, catalog nesting, course documents, error handling, CORS, static allowlist, CSP and the `api-config.js` override. The frontend suite is separate: `node Frontend/tests/frontend.test.cjs` from the repository root.

## Enabling the frontend

`Frontend/js/api-config.js` stays at `enabled: false` in the repository, so opening the site via `file://` or another static server works as before. This server answers `GET /Frontend/js/api-config.js` itself (the route is registered before the static middleware) with the same file content, only `enabled: false` replaced by `enabled: true`, `Content-Type: application/javascript` and `Cache-Control: no-store`. So any page opened through `http://localhost:3000` talks to the API with no frontend change; the default `baseUrl: '/api'` matches. If the file no longer contains `enabled: false` it is served unchanged.

## TODO

- **View, don't download.** The project proposal asks for viewing without downloading. Today `/content` serves non-PDF files as downloadable attachments and any visitor can fetch the PDF. Later: require login for `/content` of non-PDF files or serve only the PDF preview, and decide what the frontend's "Mở tệp gốc" link should do. Needs the (not yet built) auth that uses `USERS`.
- Authentication, saved documents API (`SAVED_DOCUMENT`), upload and a PDF conversion pipeline for Office files.
- `Frontend/js/data/*.js` still holds the sample catalog; the pages do not call `/api/catalog` or `/api/courses/:id/documents` yet.
- View counting happens on every metadata read (no de-duplication per user).
