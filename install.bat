@echo off
echo 🚀 Starting Workflow Platform Installation...

REM Check if running in Replit environment
if defined REPL_ID (
    echo 📦 Running in Replit environment

    REM Skip PostgreSQL checks as we're using Replit's database
    if not defined DATABASE_URL (
        echo ⚠️ DATABASE_URL not found. Please ensure the database is created in Replit.
        exit /b 1
    )

    echo ✅ Using Replit PostgreSQL database
) else (
    REM Check prerequisites for local installation
    where node >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Node.js is required but not installed. Please install Node.js 20.x first.
        exit /b 1
    )

    where psql >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ PostgreSQL is required but not installed. Please install PostgreSQL 16.x first.
        exit /b 1
    )
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Database Configuration
        echo DATABASE_URL=%DATABASE_URL%
        echo PGHOST=%PGHOST%
        echo PGPORT=%PGPORT%
        echo PGUSER=%PGUSER%
        echo PGPASSWORD=%PGPASSWORD%
        echo PGDATABASE=%PGDATABASE%
        echo PGSSLMODE=%PGSSLMODE%
        echo.
        echo # Application Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo APP_URL=%APP_URL%
        echo.
        echo # Security
        echo SESSION_SECRET=generate_a_secure_secret_here
        echo.
        echo # External Webhooks
        echo EXTERNAL_NOTIFICATION_WEBHOOK=https://your-notification-service.com/webhook
        echo EXTERNAL_AUDIT_WEBHOOK=https://your-audit-service.com/webhook
        echo.
        echo # Email Configuration
        echo SMTP_HOST=smtp.example.com
        echo SMTP_PORT=587
        echo SMTP_USER=your-smtp-user
        echo SMTP_PASS=your-smtp-password
        echo SMTP_FROM=noreply@example.com
        echo.
        echo # File Storage
        echo UPLOAD_DIR=uploads
        echo MAX_FILE_SIZE=5242880
        echo ALLOWED_FILE_TYPES=image/jpeg,image/png,application/json
        echo.
        echo # Authentication
        echo TOKEN_EXPIRY=24h
        echo REFRESH_TOKEN_EXPIRY=7d
        echo PASSWORD_RESET_EXPIRY=1h
    ) > .env
    echo ✅ Created .env file with configuration
) else (
    echo ℹ️ .env file already exists, skipping creation
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if defined REPL_ID (
    REM In Replit environment, we can proceed directly to migrations
    echo 🔄 Running database migrations...
    call npm run db:push
) else (
    REM For local installation, we need to check the database connection and create if needed
    echo 🔄 Configuring database connection...
    for /f "tokens=*" %%a in ('type .env ^| findstr "DATABASE_URL"') do set %%a
    if "%DATABASE_URL%"=="" (
        echo ⚠️ DATABASE_URL not found in .env file
        exit /b 1
    )

    REM Extract connection details using powershell
    powershell -Command "$url='%DATABASE_URL%' -replace 'postgresql://',''; $parts=$url.Split('@'); $creds=$parts[0].Split(':'); $conn=$parts[1].Split('/'); $host_port=$conn[0].Split(':'); echo \"DB_USER=$($creds[0])`nDB_PASS=$($creds[1])`nDB_HOST=$($host_port[0])`nDB_PORT=$($host_port[1])`nDB_NAME=$($conn[1])\"" > temp.env
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Failed to parse DATABASE_URL
        exit /b 1
    )

    REM Load parsed connection details
    for /f "tokens=*" %%a in (temp.env) do set %%a
    del temp.env

    REM Check if PostgreSQL is running locally
    if "%DB_HOST%"=="localhost" (
        echo 🔄 Checking local PostgreSQL service...
        sc query postgresql >nul 2>&1
        if %ERRORLEVEL% NEQ 0 (
            echo ⚠️ Local PostgreSQL service is not running
            echo To start PostgreSQL:
            echo   1. Open Services ^(services.msc^)
            echo   2. Find 'postgresql' service
            echo   3. Click 'Start'
            echo Or run: net start postgresql
            exit /b 1
        )
    )

    REM Create database if it doesn't exist
    echo 🗄️ Setting up database...
    set PGPASSWORD=%DB_PASS%
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ℹ️ Database already exists
    ) else (
        psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Database created successfully
        ) else (
            echo ⚠️ Failed to create database. You may need to:
            echo   1. Check database permissions
            echo   2. Update DATABASE_URL in .env
            echo   3. Verify the database server allows database creation
            exit /b 1
        )
    )

    REM Run migrations
    echo 🔄 Running database migrations...
    call npm run db:push
)

echo ✨ Installation complete! You can now run 'npm run dev' to start the application.