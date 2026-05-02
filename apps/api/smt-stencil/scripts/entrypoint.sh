#!/bin/sh
set -e

echo "🚀 Init application entrypoint..."
echo "⏳ Waiting for SQL Server and initializing database..."

node /app/scripts/wait-for-db.js