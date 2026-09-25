# Web and API deployment

The production website stays on Vercel at `https://www.agrisense.rw`. Keep the apex and `www` DNS records pointed at Vercel.

Vite reads `VITE_API_BASE_URL=https://api.agrisense.rw` from `.env.production`. The frontend calls `https://api.agrisense.rw/api` directly; check that no Vercel environment variable overrides this value.

The VPS runs Nginx, NestJS, the model, PostgreSQL, and Redis. Point only the `api` DNS record at the VPS and enable HTTPS there. Its CORS policy already permits the Vercel site at `https://www.agrisense.rw` and `https://agrisense.rw`.

## Optional VPS web fallback

The **Deploy Web to VPS** workflow is manual-only. It builds the Vite app and rsyncs `dist/` to `/opt/agrisense/deploy/web/` when explicitly run. Set these GitHub Actions secrets if you use it:

| Secret | Value |
|---|---|
| `VPS_HOST` | Your server's IP or hostname |
| `VPS_PORT` | SSH port (e.g. `22`) |
| `VPS_USER` | Deploy user (e.g. `deploy`) |
| `VPS_SSH_KEY` | Full private key for the deploy user (including `-----BEGIN ... PRIVATE KEY-----`) |

## Deploy key

A dedicated key `agrisense-web-deploy` should exist on the VPS in `/root/.ssh/authorized_keys`. The matching private key is what you paste into `VPS_SSH_KEY`.

## Local test of the same path

```bash
npm ci
npx vite build
# Replace the placeholders with your own values (kept in GitHub secrets, not in the repo).
rsync -az --delete -e "ssh -p ${VPS_PORT}" dist/ "${VPS_USER}@${VPS_HOST}:/opt/agrisense/deploy/web/"
```
