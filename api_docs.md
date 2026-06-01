# Backend API Docs

This document lists every HTTP API exposed by the backend in `backend/src`. The API is mounted under `/api/auth` and `/api/rag`.

## Base Notes

- All protected routes expect an `Authorization: Bearer <token>` header.
- Tokens are returned by the login endpoint and are signed with the user id and role.
- Blocked users are rejected by auth middleware and cannot log in.
- Unverified users are rejected by auth middleware and cannot log in.
- Upload is restricted to admins only.
- Question answering is available to authenticated users.
- Document upload supports `.pdf`, `.docx`, and `.txt` files.

## Auth APIs

### POST `/api/auth/register`

Registers a new user.

Request body:

```json
{
	"email": "user@example.com",
	"password": "secret123",
	"role": "admin"
}
```

Notes:

- `email` and `password` are required.
- The backend currently creates new accounts as normal users.
- Email verification is still required before login.

Success response: `201 Created`

```json
{
	"user": {
		"id": 1,
		"email": "user@example.com",
		"role": "user",
		"isBlocked": false,
		"avatarUrl": "https://www.gravatar.com/avatar/..."
	},
	"token": "jwt-token",
	"verificationRequired": true,
	"verificationEmailSent": true
}
```

Possible error responses:

- `400 Bad Request` when `email` or `password` is missing.
- `409 Conflict` when the user already exists.
- `500 Internal Server Error` for other failures.

### POST `/api/auth/login`

Logs in a verified, unblocked user and returns a JWT.

Request body:

```json
{
	"email": "user@example.com",
	"password": "secret123"
}
```

Success response: `200 OK`

```json
{
	"user": {
		"id": 1,
		"email": "user@example.com",
		"role": "user",
		"isBlocked": false,
		"avatarUrl": "https://www.gravatar.com/avatar/..."
	},
	"token": "jwt-token"
}
```

Possible error responses:

- `400 Bad Request` when `email` or `password` is missing.
- `401 Unauthorized` for invalid credentials.
- `403 Forbidden` when the email is not verified or the account is blocked.
- `500 Internal Server Error` for other failures.

### GET `/api/auth/verify-email?token=...`

Verifies a user account using the emailed verification token.

Query parameters:

- `token` is required.

Behavior:

- On success, the backend redirects to `/api/auth/verification-success`.
- On failure, the backend returns JSON with the error message.

Possible error responses:

- `400 Bad Request` when the token is missing, invalid, or expired.
- `500 Internal Server Error` for other failures.

### GET `/api/auth/verification-success`

Returns a simple HTML success page shown after email verification.

Success response: `200 OK`

### PATCH `/api/auth/users/:id/block`

Blocks a user account. Admin only.

Headers:

```http
Authorization: Bearer <admin-jwt>
```

Path parameters:

- `id` is the target user id.

Behavior:

- Admin users cannot be blocked.
- An admin cannot block their own account.

Success response: `200 OK`

```json
{
	"message": "User blocked",
	"user": {
		"id": 2,
		"email": "user@example.com",
		"role": "user",
		"isBlocked": true,
		"avatarUrl": "https://www.gravatar.com/avatar/..."
	}
}
```

Possible error responses:

- `400 Bad Request` when `id` is not a valid number.
- `401 Unauthorized` when the token is missing.
- `403 Forbidden` when the caller is not an admin, or when trying to block an admin or self.
- `404 Not Found` when the target user does not exist.
- `500 Internal Server Error` for other failures.

### PATCH `/api/auth/users/:id/unblock`

Unblocks a user account. Admin only.

Headers:

```http
Authorization: Bearer <admin-jwt>
```

Path parameters:

- `id` is the target user id.

Behavior:

- Admin users cannot be modified.
- An admin cannot unblock their own account.

Success response: `200 OK`

```json
{
	"message": "User unblocked",
	"user": {
		"id": 2,
		"email": "user@example.com",
		"role": "user",
		"isBlocked": false,
		"avatarUrl": "https://www.gravatar.com/avatar/..."
	}
}
```

Possible error responses:

- `400 Bad Request` when `id` is not a valid number.
- `401 Unauthorized` when the token is missing.
- `403 Forbidden` when the caller is not an admin, or when trying to unblock an admin or self.
- `404 Not Found` when the target user does not exist.
- `500 Internal Server Error` for other failures.

## RAG APIs

### POST `/api/rag/upload`

Uploads a document, extracts its text, chunks it, generates embeddings, and stores it.
Admin only.

Headers:

```http
Authorization: Bearer <admin-jwt>
Content-Type: multipart/form-data
```

Form fields:

- `file` is required.

Supported file types:

- `.pdf`
- `.docx`
- `.txt`

Success response: `201 Created`

```json
{
	"message": "Document uploaded",
	"documentId": 10,
	"chunkCount": 4
}
```

Possible error responses:

- `400 Bad Request` when no file is uploaded, the file type is unsupported, the document has no extractable text, or extraction fails.
- `401 Unauthorized` when the token is missing.
- `403 Forbidden` when the caller is not an admin, blocked, or unverified.
- `500 Internal Server Error` for other failures.

### POST `/api/rag/ask`

Asks a question against the uploaded document knowledge base and returns an AI-generated answer.
Any authenticated, verified, unblocked user can call this.

Headers:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Request body:

```json
{
	"question": "What does the policy say about retention?",
	"documentId": 10
}
```

Notes:

- `question` is required.
- `documentId` is optional.
- If `documentId` is omitted, the backend searches across all uploaded documents.

Success response: `200 OK`

```json
{
	"answer": "...generated response..."
}
```

Possible error responses:

- `400 Bad Request` when `question` is missing, empty, or no relevant context is found.
- `401 Unauthorized` when the token is missing.
- `403 Forbidden` when the caller is blocked or unverified.
- `500 Internal Server Error` for other failures.

## Authentication Rules Summary

- `POST /api/auth/register` and `POST /api/auth/login` are public.
- `GET /api/auth/verify-email` and `GET /api/auth/verification-success` are public.
- `POST /api/rag/upload` requires an admin JWT.
- `POST /api/rag/ask` requires any valid, verified, unblocked JWT.
- `PATCH /api/auth/users/:id/block` and `PATCH /api/auth/users/:id/unblock` require an admin JWT.

