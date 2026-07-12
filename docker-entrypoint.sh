#!/bin/sh
set -e

./node_modules/.bin/prisma migrate deploy

if [ "${SEED_DB:-false}" = "true" ]; then
  npm run db:seed
fi

exec "$@"
