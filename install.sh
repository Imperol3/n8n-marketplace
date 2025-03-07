#!/bin/bash

echo "🚀 Starting Workflow Platform Installation..."

# Check if running in Replit environment
if [ -n "$REPL_ID" ] && [ -n "$REPL_OWNER" ]; then
  echo "📦 Running in Replit environment"

  # Skip PostgreSQL checks as we're using Replit's database
  if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ DATABASE_URL not found. Please ensure the database is created in Replit."
    exit 1
  fi

  echo "✅ Using Replit PostgreSQL database"
else
  # Check prerequisites for local installation
  command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 20.x first."; exit 1; }
  command -v psql >/dev/null 2>&1 || { echo "❌ PostgreSQL is required but not installed. Please install PostgreSQL 16.x first."; exit 1; }
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << EOL
# Database Configuration
DATABASE_URL=${DATABASE_URL}
PGHOST=${PGHOST}
PGPORT=${PGPORT}
PGUSER=${PGUSER}
PGPASSWORD=${PGPASSWORD}
PGDATABASE=${PGDATABASE}
PGSSLMODE=${PGSSLMODE}

# Application Configuration
PORT=5000
NODE_ENV=development
APP_URL=${APP_URL:-http://localhost:5000}

# Security
SESSION_SECRET=$(openssl rand -hex 32)

# External Webhooks
EXTERNAL_NOTIFICATION_WEBHOOK=https://your-notification-service.com/webhook
EXTERNAL_AUDIT_WEBHOOK=https://your-audit-service.com/webhook

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

if [ -n "$REPL_ID" ]; then
  # In Replit environment, we can proceed directly to migrations
  echo "🔄 Running database migrations..."
  npm run db:push
else
  # For local installation, we need to check the database connection and create if needed
  echo "🔄 Configuring database connection..."
  if [ -f .env ]; then
    source .env
    if [[ $DATABASE_URL =~ ^postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
      DB_USER="${BASH_REMATCH[1]}"
      DB_PASS="${BASH_REMATCH[2]}"
      DB_HOST="${BASH_REMATCH[3]}"
      DB_PORT="${BASH_REMATCH[4]}"
      DB_NAME="${BASH_REMATCH[5]}"

      # Check if PostgreSQL is running locally
      if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
        echo "🔄 Checking local PostgreSQL service..."
        if ! pg_isready -h localhost -p "$DB_PORT" >/dev/null 2>&1; then
          echo "⚠️ Local PostgreSQL service is not running. Please start the service:"
          echo "  - Linux: sudo service postgresql start"
          echo "  - macOS: brew services start postgresql"
          echo "  - Windows: net start postgresql"
          exit 1
        fi
      fi

      # Create database if it doesn't exist
      echo "🗄️ Setting up database..."
      if PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "ℹ️ Database already exists"
      else
        if PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null; then
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
    else
      echo "⚠️ Invalid DATABASE_URL format"
      exit 1
    fi
  else
    echo "⚠️ .env file not found"
    exit 1
  fi
fi

echo "✨ Installation complete! You can now run 'npm run dev' to start the application."