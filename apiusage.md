# User Management API Documentation

## Base URL
```
https://your-app.replit.app/api/v1
```

## Authentication
All API endpoints require authentication. Include your API token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Endpoints:

### Generate API Token
Generate an API token for accessing the API endpoints.

**Endpoint:** `POST /token`

#### Request
Requires session authentication (must be logged in to the application)

#### Response
```json
{
  "success": true,
  "message": "API token generated successfully",
  "data": {
    "token": "your-generated-token"
  }
}
```

### Create User
Create a new user with optional password.

**Endpoint:** `POST /users`

#### Request Body
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "optional_password",  // If not provided, a password will be generated
  "role": "user",                  // "admin", "user", or "viewer"
  "tier": "free"                   // Tier name as configured in the system
}
```

#### Response
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "preferences": {
        "tier": "free",
        "interests": []
      }
    },
    "temporaryPassword": "auto8gen"  // Only included if password was auto-generated
  }
}
```

#### Example: Create User with Custom Password
```bash
curl -X POST https://your-app.replit.app/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure123",
    "role": "user",
    "tier": "free"
  }'
```

#### Example: Create User with Auto-generated Password
```bash
curl -X POST https://your-app.replit.app/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "username": "jane_doe",
    "email": "jane@example.com",
    "role": "user",
    "tier": "free"
  }'
```

### Error Responses:

#### Invalid Request (400)
```json
{
  "success": false,
  "message": "Username and email are required"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid or missing authentication token"
}
```

#### Forbidden (403)
```json
{
  "success": false,
  "message": "Insufficient permissions to perform this action"
}
```

## Notes
- Password Requirements:
  - Minimum 6 characters if provided
  - Auto-generated passwords are 8 characters long
- Username Requirements:
  - Minimum 3 characters
  - Must be unique in the system
- Email Requirements:
  - Must be a valid email format
  - Must be unique in the system
- Available Roles:
  - `admin`: Full system access
  - `user`: Standard user access
  - `viewer`: Read-only access
- Tiers:
  - Available tiers can be configured in the admin panel
  - Default tier is "free" if not specified

## Best Practices
1. Always store the auto-generated password securely and communicate it to the user through a secure channel
2. Implement rate limiting in your requests to avoid abuse
3. Use HTTPS for all API calls
4. Keep your API tokens secure and rotate them regularly
5. Handle the API responses appropriately in your application

## Support
For additional support or questions, please contact the system administrator or refer to the internal documentation.
```
</replit_final_file>