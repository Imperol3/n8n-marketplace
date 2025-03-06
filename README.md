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
  - Email and username registration

- ✅ Workflow Management
  - Upload JSON workflow files
  - Add featured images and additional media
  - Status tracking (draft, in_progress, needs_edit, published)
  - Filter workflows by status
  - Admin dashboard for workflow management
  - Category and tag system
  - User tier-based access control

- ✅ File Storage
  - Secure file uploads
  - Support for multiple file types (JSON, images)
  - Unique file naming and organization

- ✅ Database Persistence
  - PostgreSQL database integration
  - Data remains after server restarts
  - Session persistence

### Coming Soon
- 🔄 User Onboarding Flow
  - Interest selection
  - Workflow recommendations
  - Personalized dashboard
- 🔄 Advanced Search and Filtering
- 🔄 User Dashboard
- 🔄 Workflow Analytics

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

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd workflow-management-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- Other PostgreSQL-related variables (`PGHOST`, `PGUSER`, etc.)

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## User Types and Permissions

### Roles
- Admin: Full access to all features
- User: Access to workflows based on tier and interests
- Viewer: Can view public workflows without downloading

### Tiers
- Free: Basic access
- Tier 1: Access to basic workflows
- Tier 2: Access to advanced workflows
- Premium: Full access to all workflows

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## Current Status
The application is functional with core features implemented. Recent updates include:
- Enhanced user registration with email support
- Category and tag system for workflows
- User tier-based access control
- Public viewing of workflows without authentication
- Detailed workflow view pages

The next phase of development will focus on the user onboarding experience and workflow recommendations.

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
- email: text (unique)
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

## Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- Other PostgreSQL-related variables (`PGHOST`, `PGUSER`, etc.)