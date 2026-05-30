#!/bin/sh
set -e

export PORT="${PORT:-8080}"
export BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"

# Only substitute Railway vars — do NOT touch nginx $proxy_host, $uri, etc.
envsubst '${PORT} ${BACKEND_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "nginx listening on port ${PORT}, proxying API to ${BACKEND_URL}"

exec nginx -g 'daemon off;'
