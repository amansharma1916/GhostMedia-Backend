# GhostMedia Admin Implementation

This repository contains the admin panel for the GhostMedia social platform.

## Overview

The admin panel provides a web interface to manage users and content on the GhostMedia platform. It includes features to view, search, and manage users and posts.

## Setup Instructions

### Backend Setup

1. **Environment Variables**: Add the following variables to your `.env` file:
   ```
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_admin_password
   JWT_SECRET=your_jwt_secret_key
   ```

2. **Dependencies**: Install required dependencies:
   ```
   npm install jsonwebtoken
   ```

3. **Test Admin API**: Run the test script to verify the API:
   ```
   npm run test:admin-simple
   ```

### Frontend Access

1. Navigate to `/admin/login` in your browser
2. Login with the admin credentials configured in your `.env` file
3. You'll be redirected to the admin dashboard at `/admin/`

## Architecture

### Backend (Node.js/Express)

- **Routes**: Admin routes defined in `Routes/adminRoutes.js`
- **Authentication**: Simple token-based authentication
- **Models**: Uses existing User and Post models with extended functionality

### Frontend (React)

- **Admin Login**: Separate login page for admin access
- **Protected Routes**: Admin routes protected using AdminProtectedRoute component
- **Dashboard**: Central interface showing user and post management options
- **User Management**: Interface to view, search, and manage user accounts
- **Post Management**: Interface to view and moderate user posts

## Security Considerations

- Admin credentials are stored in environment variables
- API endpoints are protected with token-based authentication
- User passwords are never exposed through the API
- Frontend routes are protected against unauthorized access

## Development Notes

If you're extending the admin functionality, consider:

1. Adding more detailed analytics
2. Implementing more granular permission levels
3. Adding logging for admin actions
4. Adding more content moderation tools

## Testing

Run the backend tests with:
```
npm run test:admin-simple
```

The test will verify:
- Admin login functionality
- User retrieval
- Post retrieval

## API Documentation

Detailed API documentation is available in `admin-api-docs.md`.
