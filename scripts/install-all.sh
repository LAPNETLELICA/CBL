#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for app in storefront manager-web admin-web; do
  echo "==> Installing $app"
  (cd "$ROOT/$app" && npm install)
done
echo "Done. Copy .env.example values to each app's .env.local and run npm run dev."
