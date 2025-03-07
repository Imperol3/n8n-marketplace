# LLM Prompt for Workflow Management Platform Recreation

## Project Overview
Create a comprehensive workflow management platform with advanced user administration and deployment capabilities. The platform should focus on simplified installation and secure configuration management.

## Core Technologies
- Frontend: React + TypeScript
- Backend: Express.js + TypeScript
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js
- File Handling: Multer
- UI Components: shadcn/ui + Tailwind CSS
- State Management: TanStack Query

## Key Features to Implement

### 1. User Authentication System
- Implement secure user authentication with roles (admin, user)
- Include password hashing using scrypt
- Add session management
- Create protected routes
- Add password reset functionality with email notifications
- Store session data in PostgreSQL
- Support for multiple tiers (free, tier1, tier2, premium)

### 2. Workflow Management
- Create system for uploading and managing JSON workflow files
- Implement workflow status tracking (draft, in_progress, needs_edit, published)
- Add support for workflow metadata and media attachments
- Create filtering and search capabilities
- Build admin dashboard for workflow management
- Add user dashboard with personalized views
- Support tier-based access control for workflows

### 3. File Storage System
- Set up secure file upload system with Multer
- Support multiple file types (JSON, images)
- Implement unique file naming and organization
- Create proper file access controls based on user roles
- Handle featured images and additional media for workflows

### 4. External Integration System
- Implement two webhook endpoints for external notifications:
  1. EXTERNAL_NOTIFICATION_WEBHOOK: General notification events
  2. EXTERNAL_AUDIT_WEBHOOK: System audit events
- Add retry mechanism for failed webhook deliveries
- Include proper error handling and logging

### 5. Database Schema

#### Users Table
```sql
- id: serial (primary key)
- username: text (unique)
- password: text (hashed)
- role: text (enum: admin, user)
- preferences: jsonb {
    tier: string (enum: free, tier1, tier2, premium),
    interests: string[]
  }
- metadata: jsonb {
    isFirstLogin: boolean,
    lastLogin: string (ISO date)
  }
```

#### Workflows Table
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
    categories: string[],
    tags: string[],
    requiredTier: string,
    previewUrl: string
  }
```

## API Endpoints to Create

### Authentication
```
POST /api/v1/users - Create new user
POST /api/login - User login
POST /api/logout - User logout
GET /api/user - Get current user
POST /api/password-reset/request - Request password reset
POST /api/password-reset/reset - Reset password with token
```

### Workflow Management
```
GET /api/workflows - List workflows
GET /api/workflows/:id - Get single workflow
POST /api/workflows - Create workflow (with file upload)
PATCH /api/workflows/:id - Update workflow
DELETE /api/workflows/:id - Delete workflow
GET /api/workflows/:id/download - Download workflow file
PATCH /api/workflows/:id/status - Update workflow status
```

### User Management
```
GET /api/users - List users (admin only)
PATCH /api/users/:id - Update user (admin only)
DELETE /api/users/:id - Delete user (admin only)
```

### Tier Management
```
GET /api/tiers - List tiers
POST /api/tiers - Create tier
PATCH /api/tiers/:id - Update tier
DELETE /api/tiers/:id - Delete tier
```

## Installation Requirements
- Support for both Linux and Windows environments
- Include automated database setup
- Add environment configuration handling
- Create deployment scripts

## Environment Variables Required
```
# Database Configuration
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
PGHOST=[host]
PGPORT=[port]
PGUSER=[user]
PGPASSWORD=[password]
PGDATABASE=[database]
PGSSLMODE=[disable/require]

# Application Configuration
PORT=5000
NODE_ENV=[development/production]
APP_URL=[application-url]

# Security
SESSION_SECRET=[secure-random-string]

# External Webhooks
EXTERNAL_NOTIFICATION_WEBHOOK=[webhook-url]
EXTERNAL_AUDIT_WEBHOOK=[webhook-url]
```

## Development Guidelines
1. Use TypeScript for both frontend and backend
2. Follow modern web application patterns
3. Implement proper error handling
4. Add comprehensive logging
5. Create responsive UI design
6. Include proper documentation
7. Add automated database migrations
8. Implement proper state management
9. Add loading states and error boundaries
10. Include proper form validation

## Validation Requirements
1. User input validation using Zod schemas
2. File upload validation (size, type)
3. Role-based access validation
4. API request validation
5. Environment variable validation

## Error Handling
1. Implement proper API error responses
2. Add frontend error boundaries
3. Include proper logging
4. Add user-friendly error messages
5. Implement proper HTTP status codes

This prompt should give an LLM enough context to recreate the core functionality of the workflow management platform while maintaining proper security and best practices.