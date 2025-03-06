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
  - Categories and tags system
  - Required tier levels for access

- ✅ Public Access
  - Browse workflows without login
  - Detailed workflow views
  - Preview workflow details
  - Download for authenticated users

- ✅ File Storage
  - Secure file uploads
  - Support for multiple file types (JSON, images)
  - Unique file naming and organization

- ✅ Database Persistence
  - PostgreSQL database integration
  - Data remains after server restarts
  - Session persistence

### Coming Soon
- 🔄 User Preferences and Onboarding
  - Interest-based workflow suggestions
  - Personalized dashboard
  - Category-based access control

- 🔄 Advanced Search and Filtering
  - Filter by categories and tags
  - Search by workflow content
  - Sort by popularity and relevance

- 🔄 User Dashboard
  - Saved workflows
  - Download history
  - Preference management

- 🔄 Workflow Analytics
  - Usage tracking
  - Popular categories
  - User engagement metrics

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
- `/client/src/pages/workflow-details.tsx`: Detailed workflow view
- `/client/src/pages/home-page.tsx`: Public workflow listing

## Database Schema

### Users Table
```sql
- id: serial (primary key)
- username: text (unique)
- email: text (unique)
- password: text (hashed)
- role: text (enum: admin, user, viewer)
- preferences: jsonb {
    interests: string[]
    tier: "free" | "tier1" | "tier2" | "premium"
  }
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
- metadata: jsonb {
    categories: string[]
    tags: string[]
    previewUrl?: string
    requiredTier: "free" | "tier1" | "tier2" | "premium"
  }
```

## Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- Other PostgreSQL-related variables (`PGHOST`, `PGUSER`, etc.)

## Current Status
The application is fully functional with core features implemented. Data persistence is working through PostgreSQL integration. Public access to workflows is enabled, with protected downloads for authenticated users. The platform supports categorization and tagging of workflows, with user tiers controlling access to premium content.