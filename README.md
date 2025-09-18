lead-management-system/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── leadController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   └── leadOwnership.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   └── leads.ts
│   ├── services/
│   │   ├── authService.ts
│   │   └── leadService.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── validators.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── app.ts



# Lead Management System API Documentation

This section provides a table of all API routes for the Lead Management System, including authentication and lead management endpoints. Use Postman to test these APIs, ensuring proper authentication and role-based access control (RBAC).

## Base URL
- **Base URL**: `http://localhost:3000/api` (assuming the server runs on port 3000 in development).

## Authentication
- **JWT Token**: Required for all `/leads` routes and `/auth/password`. Obtain via `POST /api/auth/login` and include in the `Authorization` header as `Bearer <token>`.
- **Roles**:
  - `MANAGER`: Can create, assign, update, delete leads, and view all leads.
  - `SALES_REP`: Can view/update assigned leads (status: `ENGAGED` or `DISPOSED` only).
  - `ADMIN`: Limited to authentication actions (no lead creation/deletion unless explicitly allowed).

## API Routes

| Method | URL                          | Headers                                              | Body (if required)                                                                 |
|--------|------------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------|
| POST   | `/auth/login`                | `Content-Type: application/json`                     | ```json<br>{<br>  "email": "manager@example.com",<br>  "password": "password123"<br>}<br>``` |
| POST   | `/auth/register`             | `Content-Type: application/json`                     | ```json<br>{<br>  "email": "newuser@example.com",<br>  "password": "password123",<br>  "name": "New User",<br>  "role": "SALES_REP"<br>}<br>``` |
| PUT    | `/auth/password`             | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | ```json<br>{<br>  "currentPassword": "password123",<br>  "newPassword": "newpassword456"<br>}<br>``` |
| POST   | `/auth/admin/register`       | `Content-Type: application/json`                     | ```json<br>{<br>  "email": "admin@example.com",<br>  "password": "admin123",<br>  "name": "Admin User",<br>  "role": "ADMIN"<br>}<br>``` |
| POST   | `/leads`                     | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | ```json<br>{<br>  "name": "Test Lead",<br>  "email": "test@example.com",<br>  "phone": "1234567890",<br>  "notes": "Potential client"<br>}<br>``` |
| GET    | `/leads?status=<status>`     | `Authorization: Bearer <token>`                       | None                                                                              |
| GET    | `/leads/:id`                 | `Authorization: Bearer <token>`                       | None                                                                              |
| PUT    | `/leads/:id`                 | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | ```json<br>{<br>  "status": "ENGAGED",<br>  "notes": "Contacted client"<br>}<br>``` |
| PUT    | `/leads/:id/assign`          | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | ```json<br>{<br>  "assignedTo": "124"<br>}<br>``` |
| DELETE | `/leads/:id`                 | `Authorization: Bearer <token>`                       | None                                                                              |

### Route Details
1. **POST /auth/login**
   - **Description**: Authenticates a user and returns a JWT token.
   - **Success**: 200 OK, returns `{ success: true, data: { user: { id, email, role }, token } }`.
   - **Errors**: 401 (invalid credentials), 400 (invalid input).
   - **Notes**: Save the `token` for protected routes.

2. **POST /auth/register**
   - **Description**: Registers a new user (role: `SALES_REP` or `MANAGER`).
   - **Success**: 201 Created, returns `{ success: true, data: { id, email, name, role } }`.
   - **Errors**: 400 (email exists, invalid input).
   - **Notes**: Use `registerSchema` for valid roles.

3. **PUT /auth/password**
   - **Description**: Updates the authenticated user's password.
   - **Success**: 200 OK, returns `{ success: true, data: { message: "Password updated successfully" } }`.
   - **Errors**: 400 (incorrect password, invalid input), 401 (unauthorized).
   - **Notes**: Requires JWT token.

4. **POST /auth/admin/register**
   - **Description**: Registers an admin user (one-time use if no admin exists).
   - **Success**: 201 Created, returns `{ success: true, data: { id, email, role } }`.
   - **Errors**: 400 (email exists, admin exists, invalid input).
   - **Notes**: Use `adminRegisterSchema` for validation.

5. **POST /leads**
   - **Description**: Creates a new lead (restricted to `MANAGER`).
   - **Success**: 201 Created, returns lead with `userCreatedBy`, `userAssignedTo` (null).
   - **Errors**: 403 (non-`MANAGER`), 400 (invalid input).
   - **Notes**: Status defaults to `NEW`.

6. **GET /leads?status=<status>**
   - **Description**: Retrieves leads (`MANAGER`/`ADMIN`: all; `SALES_REP`: assigned only).
   - **Success**: 200 OK, returns array of leads with `userAssignedTo`, `userCreatedBy`, `activities`.
   - **Errors**: 400 (invalid query), 401 (unauthorized).
   - **Notes**: Optional `status` query (e.g., `NEW`, `ENGAGED`).

7. **GET /leads/:id**
   - **Description**: Retrieves a lead by ID (`SALES_REP` must be assigned).
   - **Success**: 200 OK, returns lead with `userAssignedTo`, `userCreatedBy`, `userUpdatedBy`, `activities`.
   - **Errors**: 404 (not found, access denied), 401 (unauthorized).
   - **Notes**: RBAC enforced in service.

8. **PUT /leads/:id**
   - **Description**: Updates a lead (`SALES_REP`: `status` to `ENGAGED`/`DISPOSED`, `notes` only; `MANAGER`/`ADMIN`: full access).
   - **Success**: 200 OK, returns updated lead with relations.
   - **Errors**: 400 (invalid status, input), 404 (not found, access denied), 401 (unauthorized).
   - **Notes**: Logs activity (`ENGAGE` or `UPDATE`).

9. **PUT /leads/:id/assign**
   - **Description**: Assigns a lead to a sales rep (restricted to `MANAGER`).
   - **Success**: 200 OK, returns updated lead with `userAssignedTo`, `activities`.
   - **Errors**: 403 (non-`MANAGER`), 400 (invalid sales rep, lead not found), 401 (unauthorized).
   - **Notes**: Sets status to `ASSIGNED`, logs `ASSIGNMENT` activity.

10. **DELETE /leads/:id**
    - **Description**: Deletes a lead (restricted to `MANAGER`).
    - **Success**: 200 OK, returns `{ success: true, message: "Lead deleted successfully" }`.
    - **Errors**: 403 (non-`MANAGER`), 400 (lead not found), 401 (unauthorized).
    - **Notes**: Cascades to delete associated activities.

## Testing with Postman

### Prerequisites
1. **Install Dependencies**:
   ```bash
   npm install winston winston-daily-rotate-file bcrypt jsonwebtoken zod @prisma/client