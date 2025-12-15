-- Initialize DEJA-VU database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create development database if it doesn't exist
SELECT 'CREATE DATABASE deja_vu_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'deja_vu_dev')\gexec

-- Create test database for testing
SELECT 'CREATE DATABASE deja_vu_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'deja_vu_test')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE deja_vu_dev TO postgres;
GRANT ALL PRIVILEGES ON DATABASE deja_vu_test TO postgres;