# CollabHub Backend API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

- **Access Token**: Bearer token in Authorization header
- **Refresh Token**: HTTP-only cookie (automatically handled)

---

## Endpoints

### 1. Register User

**POST** `/auth/register`

**Purpose:** Create a new user account

**Auth Required:** ❌ No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clh1234567890",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

- `409`: Email already in use
- `400`: Invalid input data

---

### 2. Login User

**POST** `/auth/login`

**Purpose:** Authenticate user and get access token

**Auth Required:** ❌ No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clh1234567890",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

- `401`: Invalid credentials
- `400`: Invalid input data

---

### 3. Logout User

**POST** `/auth/logout`

**Purpose:** End user session and invalidate refresh token

**Auth Required:** ✅ Yes (Refresh token from cookie)

**Request Body:** ❌ None required

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**

- `401`: Refresh token not found in cookies
- `403`: Invalid refresh token

---

### 4. Refresh Access Token

**POST** `/auth/refresh-token`

**Purpose:** Get new access token when current one expires

**Auth Required:** ✅ Yes (Refresh token from cookie)

**Request Body:** ❌ None required

**Response:**

```json
{
  "message": "Access token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `401`: Refresh token not found in cookies
- `403`: Invalid or expired refresh token

---

### 5. Create Project

**POST** `/projects`

**Purpose:** Create a new project

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "name": "New Website Launch",
  "description": "This project is for the new company website."
}
```

**Response:**

```json
{
  "id": "clh1234567890",
  "name": "New Website Launch",
  "description": "This project is for the new company website.",
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `400`: Invalid input data

---

### 6. Update Project

**PUT** `/projects/{id}`

**Purpose:** Update an existing project

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated project description."
}
```

**Response:**

```json
{
  "id": "clh1234567890",
  "name": "Updated Project Name",
  "description": "Updated project description.",
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Project not found
- `400`: Invalid input data

---

### 7. Delete Project

**DELETE** `/projects/{id}`

**Purpose:** Delete an existing project

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

- `204`: No Content (Project deleted successfully)

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Project not found

---

### 8. Send Invitation

**POST** `/projects/{projectId}/invitations`

**Purpose:** Send an invitation to a user to join a project

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "id": "clh1234567890",
  "projectId": "clh1234567890",
  "invitedById": "clh1234567890",
  "invitedUserEmail": "user@example.com",
  "status": "PENDING",
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Project not found
- `409`: User is already a member of this project
- `400`: Invalid input data

---

### 9. Accept Invitation

**GET** `/invitations/{invitationId}/accept`

**Purpose:** Accept an invitation to join a project

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

```json
{
  "message": "Invitation accepted successfully"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (invitation not for you)
- `404`: Invitation not found or already handled

---

### 10. Decline Invitation

**GET** `/invitations/{invitationId}/decline`

**Purpose:** Decline an invitation to join a project

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

```json
{
  "message": "Invitation declined successfully"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (invitation not for you)
- `404`: Invitation not found or already handled

---

### 11. Get Project Tasks

**GET** `/projects/{projectId}/tasks`

**Purpose:** Get all tasks for a specific project

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

```json
[
  {
    "id": "clh1234567890",
    "title": "Create user authentication",
    "description": "Implement JWT-based authentication system",
    "status": "IN_PROGRESS",
    "dueDate": "2023-11-15T00:00:00.000Z",
    "projectId": "clh1234567890",
    "assignments": [
      {
        "user": {
          "id": "clh1234567890",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "note": "Lead developer for this task"
      }
    ],
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
]
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (not a project member)
- `404`: Project not found

---

### 12. Get Task by ID

**GET** `/tasks/{taskId}`

**Purpose:** Get a specific task by its ID

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

```json
{
  "id": "clh1234567890",
  "title": "Create user authentication",
  "description": "Implement JWT-based authentication system",
  "status": "IN_PROGRESS",
  "dueDate": "2023-11-15T00:00:00.000Z",
  "projectId": "clh1234567890",
  "project": {
    "id": "clh1234567890",
    "name": "Website Project"
  },
  "assignments": [
    {
      "user": {
        "id": "clh1234567890",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "note": "Lead developer for this task"
    }
  ],
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (not a project member)
- `404`: Task not found

---

### 13. Update Task

**PUT** `/tasks/{taskId}`

**Purpose:** Update an existing task

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "title": "Updated task title",
  "description": "Updated task description",
  "status": "DONE",
  "dueDate": "2023-11-20T00:00:00.000Z"
}
```

**Response:**

```json
{
  "id": "clh1234567890",
  "title": "Updated task title",
  "description": "Updated task description",
  "status": "DONE",
  "dueDate": "2023-11-20T00:00:00.000Z",
  "projectId": "clh1234567890",
  "assignments": [
    {
      "user": {
        "id": "clh1234567890",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "note": "Lead developer for this task"
    }
  ],
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T15:30:00.000Z"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (not a project member)
- `404`: Task not found
- `400`: Invalid input data

---

### 14. Delete Task

**DELETE** `/tasks/{taskId}`

**Purpose:** Delete an existing task (owner only)

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

- `204`: No Content (Task deleted successfully)

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (only project owners can delete tasks)
- `404`: Task not found

---

### 15. Get User's Assigned Tasks

**GET** `/users/me/tasks`

**Purpose:** Get all tasks assigned to the current user

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

```json
[
  {
    "id": "clh1234567890",
    "title": "Create user authentication",
    "description": "Implement JWT-based authentication system",
    "status": "IN_PROGRESS",
    "dueDate": "2023-11-15T00:00:00.000Z",
    "projectId": "clh1234567890",
    "project": {
      "id": "clh1234567890",
      "name": "Website Project"
    },
    "assignments": [
      {
        "note": "Lead developer for this task",
        "assignedAt": "2023-10-27T10:00:00.000Z"
      }
    ],
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
]
```

**Error Responses:**

- `401`: Unauthorized

---

### 16. Unassign User from Task

**DELETE** `/tasks/{taskId}/assignments/{userId}`

**Purpose:** Remove a user's assignment from a task (owner only)

**Auth Required:** ✅ Yes

**Request Body:** ❌ None required

**Response:**

```json
{
  "message": "User unassigned from task successfully"
}
```

**Error Responses:**

- `401`: Unauthorized
- `403`: Forbidden (only project owners can unassign users)
- `404`: Task or assignment not found

---

## Testing Examples

### Using cURL

**Register:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!"}'
```

**Access Protected Route:**

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🗣️ Chat System API

The Chat System provides real-time communication capabilities within projects and tasks. It supports multiple channel types and role-based access control.

### Channel Types

- **PROJECT_GENERAL**: General project discussion
- **TASK_SPECIFIC**: Task-focused discussions
- **PRIVATE_DM**: Direct messages between users
- **ANNOUNCEMENTS**: Project announcements

### Channel Roles

- **ADMIN**: Can manage channel members and settings
- **MEMBER**: Can participate in discussions

---

### 1. Create Channel

**POST** `/channels`

**Purpose:** Create a new communication channel

**Auth Required:** ✅ Yes

**Request Body:**

```json
{
  "name": "General Discussion",
  "type": "PROJECT_GENERAL",
  "description": "Main project communication channel",
  "projectId": "clh1234567890",
  "taskId": "clh0987654321"
}
```

**Response:**

```json
{
  "id": "clh1111111111",
  "name": "General Discussion",
  "type": "PROJECT_GENERAL",
  "description": "Main project communication channel",
  "projectId": "clh1234567890",
  "taskId": null,
  "members": [
    {
      "channelId": "clh1111111111",
      "userId": "clh2222222222",
      "role": "ADMIN",
      "joinedAt": "2023-10-27T10:00:00.000Z",
      "user": {
        "id": "clh2222222222",
        "name": "John Doe",
        "email": "john@example.com",
        "avatarUrl": null
      }
    }
  ],
  "project": {
    "id": "clh1234567890",
    "name": "New Website Launch"
  },
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

**Error Responses:**

- `400`: Invalid input data (missing required fields)
- `403`: Access denied to project
- `404`: Task not found in project (for task-specific channels)

---

### 2. Get Project Channels

**GET** `/channels/project/{projectId}`

**Purpose:** Retrieve all channels for a project

**Auth Required:** ✅ Yes

**Response:**

```json
[
  {
    "id": "clh1111111111",
    "name": "General Discussion",
    "type": "PROJECT_GENERAL",
    "description": "Main project communication",
    "members": [
      {
        "userId": "clh2222222222",
        "role": "ADMIN",
        "user": {
          "id": "clh2222222222",
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "task": null,
    "_count": {
      "messages": 15
    },
    "createdAt": "2023-10-27T10:00:00.000Z"
  }
]
```

**Error Responses:**

- `403`: Access denied to project

---

### 3. Get Channel Details

**GET** `/channels/{channelId}`

**Purpose:** Get detailed information about a specific channel

**Auth Required:** ✅ Yes

**Response:**

```json
{
  "id": "clh1111111111",
  "name": "Task Discussion",
  "type": "TASK_SPECIFIC",
  "description": null,
  "members": [
    {
      "userId": "clh2222222222",
      "role": "ADMIN",
      "user": {
        "id": "clh2222222222",
        "name": "John Doe",
        "email": "john@example.com",
        "avatarUrl": null
      }
    }
  ],
  "project": {
    "id": "clh1234567890",
    "name": "New Website Launch"
  },
  "task": {
    "id": "clh0987654321",
    "title": "Design Homepage",
    "status": "IN_PROGRESS"
  },
  "_count": {
    "messages": 8
  },
  "createdAt": "2023-10-27T10:00:00.000Z"
}
```

**Error Responses:**

- `404`: Channel not found or access denied

---

### 4. Add Channel Member

**POST** `/channels/{channelId}/members`

**Purpose:** Add a user to a channel

**Auth Required:** ✅ Yes (Channel admin only)

**Request Body:**

```json
{
  "userId": "clh3333333333",
  "role": "MEMBER"
}
```

**Response:**

```json
{
  "channelId": "clh1111111111",
  "userId": "clh3333333333",
  "role": "MEMBER",
  "joinedAt": "2023-10-27T10:30:00.000Z",
  "user": {
    "id": "clh3333333333",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatarUrl": null
  }
}
```

**Error Responses:**

- `403`: Only channel admins can add members, or user not in project
- `404`: Channel not found

---

### 5. Send Message

**POST** `/channels/{channelId}/messages`

**Purpose:** Send a message to a channel

**Auth Required:** ✅ Yes (Channel member)

**Request Body:**

```json
{
  "content": "Hello everyone! Let's discuss the homepage design."
}
```

**Response:**

```json
{
  "id": "clh4444444444",
  "content": "Hello everyone! Let's discuss the homepage design.",
  "channelId": "clh1111111111",
  "authorId": "clh2222222222",
  "author": {
    "id": "clh2222222222",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": null
  },
  "channel": {
    "id": "clh1111111111",
    "name": "Task Discussion",
    "type": "TASK_SPECIFIC"
  },
  "createdAt": "2023-10-27T11:00:00.000Z",
  "updatedAt": "2023-10-27T11:00:00.000Z"
}
```

**Error Responses:**

- `400`: Invalid content (empty or too long)
- `403`: Not a member of this channel

---

### 6. Get Channel Messages

**GET** `/channels/{channelId}/messages?limit=50&offset=0`

**Purpose:** Retrieve messages from a channel with pagination

**Auth Required:** ✅ Yes (Channel member)

**Query Parameters:**

- `limit` (optional): Number of messages to fetch (1-100, default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

**Response:**

```json
[
  {
    "id": "clh4444444444",
    "content": "Hello everyone! Let's discuss the homepage design.",
    "channelId": "clh1111111111",
    "authorId": "clh2222222222",
    "author": {
      "id": "clh2222222222",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": null
    },
    "createdAt": "2023-10-27T11:00:00.000Z",
    "updatedAt": "2023-10-27T11:00:00.000Z"
  },
  {
    "id": "clh5555555555",
    "content": "Great idea! I'll start working on the mockups.",
    "channelId": "clh1111111111",
    "authorId": "clh3333333333",
    "author": {
      "id": "clh3333333333",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "createdAt": "2023-10-27T11:05:00.000Z",
    "updatedAt": "2023-10-27T11:05:00.000Z"
  }
]
```

**Error Responses:**

- `403`: Not a member of this channel

---

### 7. Update Message

**PUT** `/channels/messages/{messageId}`

**Purpose:** Edit a message (author only)

**Auth Required:** ✅ Yes (Message author)

**Request Body:**

```json
{
  "content": "Hello everyone! Let's discuss the homepage design. (Updated)"
}
```

**Response:**

```json
{
  "id": "clh4444444444",
  "content": "Hello everyone! Let's discuss the homepage design. (Updated)",
  "channelId": "clh1111111111",
  "authorId": "clh2222222222",
  "author": {
    "id": "clh2222222222",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": null
  },
  "channel": {
    "id": "clh1111111111",
    "name": "Task Discussion",
    "type": "TASK_SPECIFIC"
  },
  "createdAt": "2023-10-27T11:00:00.000Z",
  "updatedAt": "2023-10-27T11:30:00.000Z"
}
```

**Error Responses:**

- `400`: Invalid content
- `404`: Message not found or access denied

---

### 8. Delete Message

**DELETE** `/channels/messages/{messageId}`

**Purpose:** Delete a message (author or channel admin)

**Auth Required:** ✅ Yes (Message author or channel admin)

**Response:**

```
Status: 204 No Content
```

**Error Responses:**

- `403`: Access denied (only author or channel admin can delete)
- `404`: Message not found

---

## 🔐 Security & Authorization

### Authentication

- All endpoints require valid JWT access tokens except registration/login
- Tokens expire after 15 minutes, use refresh token endpoint for renewal

### Project Access Control

- Only project members can create channels in projects
- Only project members can be added to project channels

### Channel Access Control

- Only channel admins can add/remove members
- Only channel members can send/view messages
- Channel creators automatically become admins

### Message Permissions

- Authors can edit their own messages
- Authors and channel admins can delete messages
- Message content is validated (1-2000 characters)

---

### Using Swagger UI

1. Navigate to `http://localhost:3000/api-docs`
2. Use "Try it out" buttons for each endpoint
3. For authenticated endpoints, use the "Authorize" button with your access token

---

## Rate Limiting

- **General endpoints:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 10 requests per 15 minutes per IP

## Security Features

- Passwords are hashed using Argon2
- JWT tokens for stateless authentication
- HTTP-only cookies for refresh tokens
- Rate limiting and security headers via Helmet
