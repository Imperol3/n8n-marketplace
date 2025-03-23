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

## Quick Start Guide

### Linux Installation (Ubuntu/Debian)

#### Step 1: Install Dependencies
```bash
# Update system packages
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verify installations
node --version     # Should show v20.x.x
psql --version    # Should show 16.x
```

#### Step 2: Set Up Database
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE workflow_platform;"
sudo -u postgres psql -c "CREATE USER workflow_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE workflow_platform TO workflow_user;"
```

#### Step 3: Install Application
```bash
# Clone and setup
git clone <repository-url>
cd workflow-platform
npm install

# Create environment file
cat > .env << EOL
DATABASE_URL=postgresql://workflow_user:your_password@localhost:5432/workflow_platform
PORT=5000
NODE_ENV=production
SESSION_SECRET=$(openssl rand -hex 32)
EOL

# Initialize database
npm run db:push

# Start application
npm run build
npm start
```

### Windows Installation

#### Step 1: Install Software
1. Download and install Node.js 20.x
   - Visit https://nodejs.org
   - Download and run the LTS installer
   - ✓ Check installation: `node --version`

2. Download and install PostgreSQL 16.x
   - Visit https://www.postgresql.org/download/windows
   - Run the installer
   - Remember your password!
   - ✓ Check installation: `psql --version`

#### Step 2: Set Up Database
1. Open Command Prompt as Administrator
```cmd
# Start PostgreSQL
net start postgresql

# Create database (enter password when prompted)
psql -U postgres -c "CREATE DATABASE workflow_platform;"
psql -U postgres -c "CREATE USER workflow_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE workflow_platform TO workflow_user;"
```

#### Step 3: Install Application
1. Set up project
```cmd
# Clone repository
git clone <repository-url>
cd workflow-platform

# Install dependencies
npm install
```

2. Create `.env` file
```env
DATABASE_URL=postgresql://workflow_user:your_password@localhost:5432/workflow_platform
PORT=5000
NODE_ENV=production
SESSION_SECRET=generate_a_secure_random_string
```

3. Initialize and start
```cmd
# Setup database
npm run db:push

# Build and run
npm run build
npm start
```

## Deployment

### Prerequisites
- Node.js 18+ installed on the server
- PostgreSQL database (we use Neon Database)
- Environment variables configured (see `.env.example`)

### Deployment Options

#### 1. Manual Deployment
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```
4. Set up environment variables (see `.env.example`)
5. Start the production server:
   ```bash
   npm start
   ```

#### 2. Platform Deployment (Recommended)

##### Using Railway
1. Connect your GitHub repository to Railway
2. Add the required environment variables in Railway's dashboard
3. Railway will automatically detect the Procfile and build/start scripts
4. Deploy using Railway's dashboard

##### Using Render
1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Set the build command: `npm install && npm run build`
4. Set the start command: `npm start`
5. Add environment variables in Render's dashboard
6. Deploy using Render's dashboard

### Post-Deployment
1. Set up a custom domain (if needed)
2. Configure SSL certificates
3. Set up monitoring and logging
4. Update the admin password
5. Configure backup strategies for the database

### Production Considerations
- Use strong SESSION_SECRET
- Configure proper CORS settings if needed
- Set up rate limiting for API endpoints
- Enable SSL/TLS
- Configure proper logging
- Set up monitoring and alerts
- Regular database backups
- Configure proper caching strategies

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Linux: Check PostgreSQL status
sudo systemctl status postgresql

# Windows: Check service
net start postgresql
```

#### Permission Denied
```bash
# Linux
sudo chown -R postgres:postgres /var/lib/postgresql

# Windows
Run Command Prompt as Administrator
```

#### Port Already in Use
```bash
# Linux
sudo lsof -i :5000
sudo kill <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Need Help?
Create an issue in the repository with:
- Your operating system
- Error messages
- Steps to reproduce

For additional deployment options or custom configurations, please refer to the detailed documentation.

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