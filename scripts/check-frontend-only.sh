#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for forbidden in backend management_app docker-compose.yml docker-compose.local.yml nginx; do
  if [[ -e "$ROOT/$forbidden" ]]; then echo "Unexpected legacy backend artifact: $forbidden"; exit 1; fi
done
if grep -R -nE 'NEXT_PUBLIC_API_URL|localhost:8080|spring-backend|postgres-db' "$ROOT/storefront" "$ROOT/manager-web" "$ROOT/admin-web" --exclude-dir=node_modules; then
  echo "Legacy API reference found"; exit 1
fi
echo "Frontend-only check passed."
