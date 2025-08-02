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