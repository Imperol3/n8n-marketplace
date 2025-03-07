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
  - Password reset functionality

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

### Environment Setup

1. Clone the Repository
```bash
git clone <repository-url>
cd workflow-platform
```

2. Set Up Environment Variables
Create a `.env` file with the following required variables:
```env
# Database Configuration
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
PGHOST=<your-db-host>
PGPORT=<your-db-port>
PGUSER=<your-db-user>
PGPASSWORD=<your-db-password>
PGDATABASE=<your-db-name>
PGSSLMODE=require  # Use 'require' for cloud databases, 'disable' for local

# Application Configuration
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000  # Update for production

# Security
SESSION_SECRET=<your-secure-secret>

# External Webhooks (Optional)
EXTERNAL_NOTIFICATION_WEBHOOK=https://your-notification-service.com/webhook
EXTERNAL_AUDIT_WEBHOOK=https://your-audit-service.com/webhook
```

### Installation Steps

1. Install Dependencies
```bash
npm install
```

2. Database Setup
```bash
# Create database (if using local PostgreSQL)
createdb workflow_platform

# Run database migrations
npm run db:push
```

3. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Platform-Specific Deployment

#### Replit
1. Create a new Repl
2. Import your repository
3. Use the "Create Database" option in Replit to set up PostgreSQL
4. The database environment variables will be automatically configured

#### Traditional Hosting (e.g., DigitalOcean, AWS)
1. Set up a Node.js environment
2. Configure PostgreSQL database
3. Set up environment variables
4. Use PM2 or similar process manager:
```bash
npm install -g pm2
pm2 start npm --name "workflow-platform" -- start
pm2 startup
pm2 save
```

#### Container Deployment
1. Ensure Docker is installed
2. Build the container:
```bash
docker build -t workflow-platform .
docker run -p 5000:5000 --env-file .env workflow-platform
```

### Troubleshooting

#### Database Connection Issues
1. Verify PostgreSQL is running:
```bash
# Linux
sudo service postgresql status

# macOS
brew services list

# Windows
sc query postgresql
```

2. Check Connection:
```bash
psql -h <host> -p <port> -U <user> -d <database>
```

3. Common Issues:
- SSL Mode: Ensure PGSSLMODE is set correctly ('require' for cloud, 'disable' for local)
- Port Access: Check firewall rules allow database port
- Credentials: Verify username/password are correct
- Database Exists: Confirm database was created

#### Application Issues
1. Check Logs:
```bash
# Development
npm run dev

# Production
pm2 logs workflow-platform
```

2. Verify Environment:
- Node.js version (`node -v`)
- NPM packages installed (`npm ls`)
- Environment variables set (`printenv`)

#### File Upload Issues
1. Ensure upload directory exists and has correct permissions
2. Check file size limits in your server configuration
3. Verify supported file types are configured correctly

### Security Considerations
1. Use strong passwords for database and session secrets
2. Enable SSL/TLS in production
3. Configure proper firewall rules
4. Keep Node.js and dependencies updated
5. Set up proper CORS configuration
6. Implement rate limiting for API endpoints

### Monitoring
1. Set up application logging
2. Configure error tracking
3. Monitor server resources
4. Implement backup strategies

For additional help or custom deployment scenarios, please create an issue in the repository.

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