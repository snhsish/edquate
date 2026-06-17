#!/bin/sh
set -e

# Shared Docker network — created by the Ravan stack (version-V2).
# If missing, create it so this compose can start; Ravan nginx must also be on it.
if ! docker network inspect edquate-internal >/dev/null 2>&1; then
  echo "Creating docker network edquate-internal..."
  docker network create edquate-internal
  echo "Run 'docker compose up -d' in ~/ravan/version-V2 so nginx joins this network."
fi

docker compose up -d --build --remove-orphans "$@"
