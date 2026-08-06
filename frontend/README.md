# Rules Console — frontend

Public, read-only reference site for the homebrew Traveller 2e ruleset held in
`../backend`. The landing page is a dashboard that links to every dataset the
API serves; each dataset page offers search, filtering and a dense table view.

## Running it

The site reads from the Hono API in `../backend`, so start that first:

```bash
cd ../backend
docker compose up -d        # Postgres on :5432
npm install
npm run db:push             # sync schema
npm run db:seed             # load the rules data
npm run dev                 # API on :5000
```

Then, in this directory:

```bash
npm install
npm run dev                 # site on :3000
```

If the API is unreachable the site still renders: the dashboard marks the
affected datasets offline and each page shows the transport error along with the
commands above.

## Configuration

| Variable       | Default                 | Purpose                        |
| -------------- | ----------------------- | ------------------------------ |
| `API_BASE_URL` | `http://localhost:5000` | Base URL of the rules API      |

Copy `.env.example` to `.env.local` to override it.

## How it fits together

Data is fetched in Server Components, so the browser never calls the API
directly and no CORS round trip is involved (the backend also sends
`Access-Control-Allow-Origin: *` for anyone who wants to read it directly).
Pages are server-rendered on demand so the site always reflects the current
database.

| Path                    | Endpoint           |
| ----------------------- | ------------------ |
| `/`                     | dashboard, reads all of the below |
| `/actions`              | `/actions`         |
| `/conditions`           | `/conditions`      |
| `/called-shots`         | `/called-shots`    |
| `/critical-injuries`    | `/critical-injury` |
| `/healing`              | `/healing`         |
| `/feats`                | `/feats`           |
| `/npcs`                 | `/npc-catalog`     |
| `/traits`               | `/traits`          |

Key modules:

- `lib/api.ts` — typed fetchers; never throw, return `{ ok, data, error }`.
- `lib/modules.ts` — single registry of datasets driving the dashboard, the
  navigation rail, the footer and each page header.
- `lib/records.ts` — the normalised `DataRecord` shape every dataset maps onto.
- `components/data-explorer.tsx` — client-side search, filter and view switching.
- `components/ui/` — shadcn components; everything else in `components/` is
  bespoke console chrome.

Add more shadcn primitives with `npx shadcn@latest add <name>`.
