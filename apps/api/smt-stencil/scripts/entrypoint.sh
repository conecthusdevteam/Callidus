#!/bin/sh
set -e

echo "🚀 Init application entrypoint..."
echo "⏳ Waiting for SQL Server..."

until /opt/mssql-tools18/bin/sqlcmd -S $DB_HOST -U "$DB_USER" -P "$DB_PASSWORD" -C -N -Q "SELECT 1" > /dev/null 2>&1;
    if [ $? -eq 0 ]; then
     break
    fi
  echo "SQL Server is not ready yet... waiting 2 seconds"
  sleep 2
done

echo "✅ SQL Server is ready!"

echo "Executing database initialization script..."
./init-db.sh

echo "🚀 Initializing NestJS application..."
exec npm start:dev