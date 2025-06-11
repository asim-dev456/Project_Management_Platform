# Project Management Platform

A full-featured Node.js backend for managing projects, tasks, and users with authentication, authorization, file uploads, and Swagger documentation.

---

## Features

- JWT-based authentication with role-based authorization (Admin, Manager, User)
- RESTful API for managing users, projects, and tasks
- File upload support using `multer`
- Swagger UI documentation (`/api-docs`)
- Health check endpoint
- Email-based OTP verification for admin logins
- Refresh token mechanism for session continuity

## Project Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory and configure:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/project-platform
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
REDIS_URL=redis://localhost:6379
EMAIL_USER=you@example.com
EMAIL_PASS=your_password
```

### 3. Run the Server

```bash
npm start
```

---

##  Architectural Decisions

- **Modular MVC structure** for scalability
- **Express middleware** for authentication, authorization, error handling
- **MongoDB** for data persistence
- **Redis** (optional) for token caching/session management
- **Swagger** for self-documented APIs

---

##  API Usage

Swagger UI: [https://project-management-platform-production.up.railway.app/api-docs/](https://project-management-platform-production.up.railway.app/api-docs/)

### Core Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive tokens
- `POST /api/auth/logout` - Logout and revoke tokens
- `POST /api/auth/refresh-token` - Refresh JWT access token
- `POST /api/auth/verify-otp` - Verify OTP for admin login

### Project & Task Management

- `POST /api/projects/create` - Manager creates a project
- `PUT /api/projects/update/:id` - Manager updates project
- `GET /api/projects/list` - Manager lists projects
- `POST /api/tasks/create` - Manager creates task (with attachments)
- `PATCH /api/tasks/update/:id` - User updates task status
- `PATCH /api/uploads/attachments/:id` - Add files to task
- `DELETE /api/tasks/delete/:id` - Manager deletes a task

---

## Testing Instructions

### Run Tests

```bash
npm test
```

### Coverage Report

(If using Jest + coverage)

```bash
npm run test:coverage
```

> To enable this, add to `package.json`:

```json
"scripts": {
  "test": "jest",
  "test:coverage": "jest --coverage"
}
```

---

## Deployment Guidelines

1. **Logging**: Use a tool like `winston` or `pino` for production logging
2. **CORS**: Whitelist frontend deployment URL
3. **Swagger URL**: Update Swagger `servers` field for deployed domain:

```js
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
    },
    servers: [
      { url: 'https://your-production-url.com' }
    ]
  },
  apis: ['./routes/*.js'],
};
```

---

## Security

- Passwords hashed using `bcrypt`
- Access tokens signed with JWT and short expiry
- Refresh tokens stored securely
- Role-based route protection
- 2FA for admin users via OTP

