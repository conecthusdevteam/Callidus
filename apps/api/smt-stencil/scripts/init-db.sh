#!/bin/sh

set -e

echo "Verifying/creating database: $DB_DATABASE"

/opt/mssql-tools18/bin/sqlcmd -S sqlserver -U "$DB_USER" -P "$DB_PASSWORD" -C -N -Q "
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$DB_DATABASE')
BEGIN
  CREATE DATABASE [$DB_DATABASE]
  PRINT 'Database $DB_DATABASE created successfully.'
END
ELSE
BEGIN
  PRINT 'Database $DB_DATABASE already exists.'
END
"

echo "Database verification/creation completed!"