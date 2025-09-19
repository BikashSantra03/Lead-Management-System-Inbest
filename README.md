# Lead Management System API Documentation

This section provides a table of all API routes for the Lead Management System, including authentication and lead management endpoints. Use Postman to test these APIs, ensuring proper authentication and role-based access control (RBAC).

This section provides the folder structure and a table of all API routes for the Lead Management System, including authentication and lead management endpoints. Use Postman to test these APIs, ensuring proper authentication and role-based access control (RBAC).

## 📂 Folder Structure

The project is organized as follows:

-   **src/config/**: Database configuration (`database.ts` for Prisma setup).
-   **src/controllers/**: Request handlers for auth (`authController.ts`) and leads (`leadController.ts`).
-   **src/middleware/**: Authentication (`auth.ts`), RBAC (`rbac.ts`), and lead ownership checks (`leadOwnership.ts`).
-   **src/routes/**: Express routes for auth (`auth.ts`) and leads (`leads.ts`).
-   **src/services/**: Business logic for auth (`authService.ts`) and leads (`leadService.ts`), with centralized logging.
-   **src/types/**: TypeScript type definitions (`index.ts`).
-   **src/utils/**: Logger (`logger.ts`) and Zod validators (`validators.ts`).
-   **prisma/**: Prisma schema (`schema.prisma`) for database models.
-   **.env**: Environment variables (e.g., `JWT_SECRET`, `MONGODB_URI`).
-   **package.json**: Project dependencies and scripts.
-   **app.ts**: Main Express application entry point.

## 📦 Prerequisites

Before running the project, ensure you have the following installed and configured:

1. **Install dependencies:**

    ```bash
    npm install

    ```

2. **Create a `.env` file in the project root with the following variables**:

    ```env
    PORT=3000
    MONGODB_URI=<your-mongodb-uri>
    JWT_SECRET=<your-jwt-secret>
    NODE_ENV=development
    LOG_DIR=logs
    LOG_FILE=app-%DATE%.log
    MAIL_HOST=smtp.gmail.com
    MAIL_USER=<your-email-address>
    MAIL_PASS=<your-email-app-password>


    ```

## ⛃ Database Setup with Prisma

1. **Push Database Schema**:

    - Ensure `MONGODB_URI` is set in your `.env` file with your MongoDB connection string (e.g., `mongodb://localhost:27017/leadmgmt` for local or MongoDB Atlas URL).
    - Apply the Prisma schema to your MongoDB database:
        ```bash
            npx prisma db push
        ```

2. **Generate Prisma Client**:
    - Generate the Prisma client for use in the application:
        ```bash
            npx prisma generate
        ```
3. **Seed the Database**:
    - In the @prisma/seed.ts file Create an Admin user by giving the Admin details, then run the below command
        ```bash
            npx prisma db seed
        ```
4. **Track the Database from Prisma Studio**:
    ```bash
        npx prisma studio
    ```

## 🔗 Base URL

-   **Base URL**: `http://localhost:3000/api` (assuming the server runs on port 3000 in development).

## 🚀 Run The Project

    ```bash
        npm run dev
    ```

## 🔐 Authentication

-   **JWT Token**: Required for all `/leads` routes and `/auth/password`. Obtain via `POST /api/auth/login` and include in the `Authorization` header as `Bearer <token>`.
-   **Roles**:
    -   `MANAGER`: Can create, assign, update, delete leads, and view all leads.
    -   `SALES_REP`: Can view/update assigned leads (status: `ENGAGED` or `DISPOSED` only).
    -   `ADMIN`: Limited to authentication actions (no lead creation/deletion unless explicitly allowed).

## 🌐 API Routes

| Method | URL                      | Headers                                                             | Body (if required)                                                                                                                            |
| ------ | ------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`            | `Content-Type: application/json`                                    | `json<br>{<br>  "email": "manager@example.com",<br>  "password": "password123"<br>}<br>`                                                      |
| POST   | `/auth/register`         | `Content-Type: application/json`                                    | `json<br>{<br>  "email": "newuser@example.com",<br>  "password": "password123",<br>  "name": "New User",<br>  "role": "SALES_REP"<br>}<br>`   |
| PUT    | `/auth/password`         | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | `json<br>{<br>  "currentPassword": "password123",<br>  "newPassword": "newpassword456"<br>}<br>`                                              |
| POST   | `/auth/admin/register`   | `Content-Type: application/json`                                    | `json<br>{<br>  "email": "admin@example.com",<br>  "password": "admin123",<br>  "name": "Admin User",<br>  "role": "ADMIN"<br>}<br>`          |
| POST   | `/leads`                 | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | `json<br>{<br>  "name": "Test Lead",<br>  "email": "test@example.com",<br>  "phone": "1234567890",<br>  "notes": "Potential client"<br>}<br>` |
| GET    | `/leads?status=<status>` | `Authorization: Bearer <token>`                                     | None                                                                                                                                          |
| GET    | `/leads/:id`             | `Authorization: Bearer <token>`                                     | None                                                                                                                                          |
| PUT    | `/leads/:id`             | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | `json<br>{<br>  "status": "ENGAGED",<br>  "notes": "Contacted client"<br>}<br>`                                                               |
| PUT    | `/leads/:id/assign`      | `Content-Type: application/json`<br>`Authorization: Bearer <token>` | `json<br>{<br>  "assignedTo": "124"<br>}<br>`                                                                                                 |
| DELETE | `/leads/:id`             | `Authorization: Bearer <token>`                                     | None                                                                                                                                          |

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

4. **POST /leads**

    - **Description**: Creates a new lead (restricted to `MANAGER`).
    - **Success**: 201 Created, returns lead with `userCreatedBy`, `userAssignedTo` (null).
    - **Errors**: 403 (non-`MANAGER`), 400 (invalid input).
    - **Notes**: Status defaults to `NEW`.

5. **GET /leads?status=<status>**

    - **Description**: Retrieves leads (`MANAGER`/`ADMIN`: all; `SALES_REP`: assigned only).
    - **Success**: 200 OK, returns array of leads with `userAssignedTo`, `userCreatedBy`, `activities`.
    - **Errors**: 400 (invalid query), 401 (unauthorized).
    - **Notes**: Optional `status` query (e.g., `NEW`, `ENGAGED`).

6. **GET /leads/:id**

    - **Description**: Retrieves a lead by ID (`SALES_REP` must be assigned).
    - **Success**: 200 OK, returns lead with `userAssignedTo`, `userCreatedBy`, `userUpdatedBy`, `activities`.
    - **Errors**: 404 (not found, access denied), 401 (unauthorized).
    - **Notes**: RBAC enforced in service.

7. **PUT /leads/:id**

    - **Description**: Updates a lead (`SALES_REP`: `status` to `ENGAGED`/`DISPOSED`, `notes` only; `MANAGER`/`ADMIN`: full access).
    - **Success**: 200 OK, returns updated lead with relations.
    - **Errors**: 400 (invalid status, input), 404 (not found, access denied), 401 (unauthorized).
    - **Notes**: Logs activity (`ENGAGE` or `UPDATE`).

8. **PUT /leads/:id/assign**

    - **Description**: Assigns a lead to a sales rep (restricted to `MANAGER`).
    - **Success**: 200 OK, returns updated lead with `userAssignedTo`, `activities`.
    - **Errors**: 403 (non-`MANAGER`), 400 (invalid sales rep, lead not found), 401 (unauthorized).
    - **Notes**: Sets status to `ASSIGNED`, logs `ASSIGNMENT` activity.

9. **DELETE /leads/:id**
    - **Description**: Deletes a lead (restricted to `MANAGER`).
    - **Success**: 200 OK, returns `{ success: true, message: "Lead deleted successfully" }`.
    - **Errors**: 403 (non-`MANAGER`), 400 (lead not found), 401 (unauthorized).
    - **Notes**: Cascades to delete associated activities.

## 👮 Testing the API with Postman

To test the Lead Management System APIs, use the provided Postman collection via the public link or the local JSON file included in the repository.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://www.postman.com/navigation-cosmologist-79247986/workspace/lead-management-system-apis/collection/45058070-05c74aea-9e79-4b42-b65f-16c31ece56bf?action=share&creator=45058070)

**Steps**:

1. **Import the Collection**:
    - **Option 1: Use the Public Link**:
        - Click the "Run in Postman" button above to import the collection directly.
    - **Option 2: Use the Local JSON File**:
        - Download or copy the `LeadManagementSystem.postman_collection.json` file from the root directory of this repository.
        - In Postman, go to File > Import > Upload the `LeadManagementSystem.postman_collection.json` file.
2. Set up an environment in Postman with the following variables:
    - `base_url`: Set to your API server URL (e.g., `http://localhost:3000/api`).
    - `token`: Leave empty (auto-populated by the `Login` request).
3. Run the `Login` request (`POST /auth/login`) with `email: admin@example.com`, `password: admin123` (seeded admin user) to get a JWT token.
4. Test other endpoints (e.g., `Register User`, `Create Lead`). Update placeholder IDs (e.g., `456` for lead ID, `124` for user ID) with actual database values.
5. Check the email inbox for `Register User` to verify the registration email (sent to the provided email).

**Notes**:

-   Ensure the API server is running (`npm run dev`).
-   Check logs in `logs/app-YYYY-MM-DD.log` for debugging.
-   Email sending requires valid `MAIL_USER` and `MAIL_PASS` in `.env`.

```

```
