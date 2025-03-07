# Workflow Management Platform

A comprehensive platform for creating, storing, and administering JSON-based workflows with advanced administrative capabilities. Built with TypeScript, React, and PostgreSQL.

## Overview

This platform allows users to:
- Upload and manage JSON workflow files
- Track workflow statuses through different stages
- Manage workflow metadata and associated media
- Control access through role-based authentication

## Features

### Currently Working
- ✅ User Authentication System
  - Admin and user roles
  - Secure password hashing
  - Session management
  - Protected routes

- ✅ Workflow Management
  - Upload JSON workflow files
  - Add featured images and additional media
  - Status tracking (draft, in_progress, needs_edit, published)
  - Filter workflows by status
  - Admin dashboard for workflow management
  - Advanced workflow editing capabilities
  - User dashboard with personalized views

- ✅ File Storage
  - Secure file uploads
  - Support for multiple file types (JSON, images)
  - Unique file naming and organization

- ✅ Database Persistence
  - PostgreSQL database integration
  - Data remains after server restarts
  - Session persistence

- ✅ Search and Filtering
  - Advanced search capabilities
  - Filter by multiple criteria
  - Sort and organize workflows

### Coming Soon
- 🔄 Real-time Collaboration Features
- 🔄 Advanced Analytics Dashboard
- 🔄 Custom Workflow Templates
- 🔄 API Integration Framework
- 🔄 Automated Workflow Testing

## Deployment Guide

### Prerequisites
- Node.js v20.x or later
- PostgreSQL 16.x
- Git (for version control)
- npm (included with Node.js)

### Windows Deployment

1. Install Required Software
```bash
# Install Node.js
- Download Node.js 20.x from https://nodejs.org
- Run the installer and follow the prompts
- Verify installation: node --version

# Install PostgreSQL
- Download PostgreSQL 16.x from https://www.postgresql.org/download/windows
- Run the installer
- Note down the password you set for the 'postgres' user
- Add PostgreSQL bin directory to PATH if not done automatically
```

2. Clone and Setup Project
```bash
# Create project directory
md workflow-platform
cd workflow-platform

# Clone the repository (if using version control)
git clone <repository-url> .

# Install dependencies
npm install
```

3. Configure PostgreSQL
```bash
# Create database
psql -U postgres
CREATE DATABASE workflow_platform;
\q

# Run database migrations
npm run db:push
```

4. Configure Environment Variables
```bash
# Create .env file
echo > .env

# Add the following to .env:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/workflow_platform
SESSION_SECRET=your_secure_session_secret
APP_URL=http://localhost:5000
```

5. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Linux Server Deployment

1. Install Required Software
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verify installations
node --version
psql --version
```

2. Configure PostgreSQL
```bash
# Switch to postgres user
sudo -i -u postgres

# Create database
createdb workflow_platform

# Set password for postgres user
psql
\password postgres
# Enter your password when prompted
\q
exit
```

3. Clone and Setup Project
```bash
# Create project directory
mkdir workflow-platform
cd workflow-platform

# Clone the repository (if using version control)
git clone <repository-url> .

# Install dependencies
npm install
```

4. Configure Environment Variables
```bash
# Create and edit .env file
nano .env

# Add the following:
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/workflow_platform
SESSION_SECRET=your_secure_session_secret
APP_URL=http://your_domain_or_ip:5000
```

5. Setup Process Manager (PM2)
```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start npm --name "workflow-platform" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

### Production Considerations

1. Security
- Use strong passwords for database and session secrets
- Enable SSL/TLS for production deployments
- Configure proper firewall rules
- Keep Node.js and dependencies updated

2. Performance
- Enable Node.js production mode: `NODE_ENV=production`
- Use a reverse proxy (Nginx/Apache) for production
- Configure proper caching headers
- Enable GZip compression

3. Monitoring
- Setup application logging
- Configure error tracking
- Monitor server resources
- Setup backup strategies

4. Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `APP_URL`: Application URL (for password reset links, etc.)
- Other PostgreSQL-related variables (`PGHOST`, `PGUSER`, etc.)

## Technical Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- React Hook Form for form management
- Zod for validation

### Backend
- Express.js server
- PostgreSQL database
- Drizzle ORM
- Passport.js for authentication
- Multer for file uploads

### Core Dependencies
```json
{
  "main": [
    "@tanstack/react-query",
    "express",
    "drizzle-orm",
    "passport",
    "multer"
  ],
  "ui": [
    "shadcn/ui",
    "tailwindcss",
    "lucide-react"
  ],
  "form": [
    "react-hook-form",
    "zod"
  ]
}
```

## Critical Files

### Schema and Data Models
- `/shared/schema.ts`: Core data models and types
  ```typescript
  // Key models
  - users (authentication)
  - workflows (main workflow data)
  ```

### Server Components
- `/server/storage.ts`: Database operations and storage interface
- `/server/auth.ts`: Authentication logic and middleware
- `/server/routes.ts`: API endpoints
- `/server/db.ts`: Database configuration

### Frontend Pages
- `/client/src/pages/admin-page.tsx`: Admin dashboard
- `/client/src/pages/auth-page.tsx`: Authentication page

## Database Schema

### Users Table
```sql
- id: serial (primary key)
- username: text (unique)
- password: text (hashed)
- role: text (enum: admin, user, viewer)
```

### Workflows Table
```sql
- id: serial (primary key)
- title: text
- description: text
- filePath: text
- featuredImage: text
- extraImages: text[]
- videoUrl: text
- status: text (enum: draft, in_progress, needs_edit, published)
- metadata: jsonb
```

## Current Status
The application is fully functional with core features implemented. Data persistence is working through PostgreSQL integration. The next phase of development will focus on enhancing the editing capabilities and user experience.