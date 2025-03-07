#!/bin/bash

echo "🚀 Starting Workflow Platform Installation..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 20.x first."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "❌ PostgreSQL is required but not installed. Please install PostgreSQL 16.x first."; exit 1; }

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow_platform
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=workflow_platform
PGSSLMODE=require # Use 'require' for cloud databases, 'disable' for local

# Application Configuration
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000

# Security
SESSION_SECRET=$(openssl rand -hex 32)

# Webhooks
WEBHOOK_URL=https://dev.funautomations.io/webhook/df04170e-9c37-4acd-8427-991d22029f27

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/json

# Authentication
TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
PASSWORD_RESET_EXPIRY=1h
EOL
  echo "✅ Created .env file with default configuration"
else
  echo "ℹ️ .env file already exists, skipping creation"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Parse DATABASE_URL and set connection parameters
echo "🔄 Configuring database connection..."
if [ -f .env ]; then
  source .env
  if [[ $DATABASE_URL =~ ^postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"

    # Set up connection parameters
    export PGUSER=$DB_USER
    export PGPASSWORD=$DB_PASS
    export PGHOST=$DB_HOST
    export PGPORT=$DB_PORT
    export PGDATABASE=$DB_NAME
    export PGSSLMODE=${PGSSLMODE:-require}  # Default to require for cloud databases

    echo "📊 Database configuration:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  SSL Mode: $PGSSLMODE"
  else
    echo "⚠️ Invalid DATABASE_URL format"
    exit 1
  fi
else
  echo "⚠️ .env file not found"
  exit 1
fi

# Test PostgreSQL connection
echo "🔄 Testing PostgreSQL connection..."
if ! PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
  echo "⚠️ PostgreSQL connection failed. Please check:"
  echo "  1. Database credentials are correct"
  echo "  2. Database server is accessible"
  echo "  3. SSL mode is properly configured (current: $PGSSLMODE)"
  exit 1
fi

# Create database if it doesn't exist
echo "🗄️ Setting up database..."
if PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -lqt | cut -d \| -f 1 | grep -qw workflow_platform; then
  echo "ℹ️ Database already exists"
else
  if PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE workflow_platform;" 2>/dev/null; then
    echo "✅ Database created successfully"
  else
    echo "⚠️ Failed to create database. You may need to:"
    echo "  1. Check database permissions"
    echo "  2. Update DATABASE_URL in .env"
    echo "  3. Verify the database server allows database creation"
  fi
fi

# Run migrations
echo "🔄 Running database migrations..."
npm run db:push

echo "✨ Installation complete! You can now run 'npm run dev' to start the application."