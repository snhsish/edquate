# Edquate

Standalone Next.js frontend. The backend lives in the `Ravan` repo and runs on the VPS. This repo is **not** meant to be run on your laptop — deploy it to the server via GitHub Actions.

## Deployment (VPS only)

Push to `main` triggers `.github/workflows/deploy.yml`, which SSHs into the VPS and runs:

```bash
cd /opt/edquate
git pull origin main
docker compose up -d --build --remove-orphans
```

### First-time server setup

On the VPS:

```bash
git clone https://github.com/snhsish/edquate.git /opt/edquate
cd /opt/edquate
cp .env.example .env
# edit .env if API_BACKEND_URL differs from default
docker compose up -d --build
```

Configure GitHub repo secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.

The standalone container is `edquate-standalone-frontend` on host port `127.0.0.1:3202`. Nginx (Ravan stack) exposes it at **https://v2.edquate.com:8500**. The old frontend stays on **https://v2.edquate.com:8443**.

| URL | Frontend |
|-----|----------|
| `https://v2.edquate.com:8443` | Ravan (`edquate-frontend` → port 3201) |
| `https://v2.edquate.com:8500` | Standalone (`edquate-standalone-frontend` → port 3202) |

API calls from the standalone app proxy to `https://v2.edquate.com:8443` (same backend as the old site).

See `backend-api-doc.md` for the API reference.
