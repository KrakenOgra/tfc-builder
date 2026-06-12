#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm install
npm run build
exec node dist/server.js
