# HER ZAMAN KIYER - Deployment

## Render
This project is configured for a Node Web Service.

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Root Directory: leave empty / repository root
- Health Check: `/api/health`

## Required environment variables
Set these in Render > Environment:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is also accepted as a fallback name.

Do not put these secrets in GitHub.

## Supabase persistence
Production database operations use Supabase PostgreSQL. The local `db.json` data is retained only for the one-time migration helper and is not used as the production source of truth.

## Important
The admin dashboard reads all menu items from `/api/admin/menu`, while the public menu reads only available items from `/api/menu`.

After pushing to GitHub, Render should auto-deploy the new commit if Auto-Deploy is enabled.
