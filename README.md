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

The container listens on `127.0.0.1:3201` on the server (for nginx upstream). API calls proxy to `https://v2.edquate.com:8443` — no backend runs in this container.

See `backend-api-doc.md` for the API reference.
