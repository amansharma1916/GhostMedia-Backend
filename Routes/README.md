# Admin API Endpoints Documentation

This document outlines the available admin API endpoints for the GhostMedia platform.

## Authentication

### Admin Login
- **URL**: `/api/admin/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "adminUsername",
    "password": "adminPassword"
  }
  ```
- **Success Response**:
  ```json
  {
    "message": "Admin login successful",
    "success": true,
    "token": "admin-authenticated"
  }
  ```
- **Error Response**:
  ```json
  {
    "message": "Invalid admin credentials"
  }
  ```

## User Management

### Get All Users
- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `limit` - Number of users per page (default: 10)
  - `search` - Search term for username or email
- **Headers**:
  - `Authorization: Bearer admin-authenticated`
- **Success Response**:
  ```json
  {
    "users": [
      {
        "_id": "user_id",
        "username": "username",
        "email": "user@example.com",
        "bio": "User bio",
        "profilePicture": "url_to_profile_picture",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "status": "active"
      }
    ],
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 50
  }
  ```

### Update User Status (Ban/Unban)
- **URL**: `/api/admin/users/:id`
- **Method**: `PATCH`
- **Headers**:
  - `Authorization: Bearer admin-authenticated`
- **Body**:
  ```json
  {
    "status": "active" // or "banned"
  }
  ```
- **Success Response**:
  ```json
  {
    "message": "User activated successfully", // or "User banned successfully"
    "user": {
      "_id": "user_id",
      "username": "username",
      "email": "user@example.com",
      "status": "active" // or "banned"
      // Other user fields
    }
  }
  ```

## Post Management

### Get Posts by Username
- **URL**: `/api/admin/posts/:username`
- **Method**: `GET`
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `limit` - Number of posts per page (default: 10)
  - `search` - Search term for post content
- **Headers**:
  - `Authorization: Bearer admin-authenticated`
- **Success Response**:
  ```json
  {
    "posts": [
      {
        "_id": "post_id",
        "content": "Post content",
        "username": "username",
        "userAvatar": "url_to_avatar",
        "isGhost": false,
        "likes": 10,
        "comments": [],
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "currentPage": 1,
    "totalPages": 3,
    "totalPosts": 25
  }
  ```

### Get All Posts
- **URL**: `/api/admin/posts`
- **Method**: `GET`
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `limit` - Number of posts per page (default: 10)
  - `search` - Search term for post content
- **Headers**:
  - `Authorization: Bearer admin-authenticated`
- **Success Response**:
  ```json
  {
    "posts": [
      {
        "_id": "post_id",
        "content": "Post content",
        "username": "username",
        "userAvatar": "url_to_avatar",
        "isGhost": false,
        "likes": 10,
        "comments": [],
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "currentPage": 1,
    "totalPages": 3,
    "totalPosts": 25
  }
  ```

### Delete Post
- **URL**: `/api/admin/posts/:id`
- **Method**: `DELETE`
- **Headers**:
  - `Authorization: Bearer admin-authenticated`
- **Success Response**:
  ```json
  {
    "message": "Post deleted successfully",
    "postId": "post_id"
  }
  ```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (resource not found)
- `500` - Server Error

Error responses follow this format:
```json
{
  "message": "Error message describing what went wrong"
}
```

## Authentication Headers

For all protected endpoints, include the admin token in the request headers:
```
Authorization: Bearer admin-authenticated
```
