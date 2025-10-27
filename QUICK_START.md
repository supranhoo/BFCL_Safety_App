# Quick Start Guide - BFCL Safety Management System

## For Developers Starting on This Project

This guide will get you up and running with the BFCL Safety Management System backend in under 10 minutes.

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

---

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/supranhoo/BFCL_Safety_App.git
cd BFCL_Safety_App
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for the entire monorepo (API, shared packages).

### 3. Setup Environment Variables

```bash
cp services/api/.env.example services/api/.env
```

Edit `services/api/.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bfcl_safety?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
```

### 4. Start PostgreSQL Database

```bash
docker-compose up -d postgres
```

This starts PostgreSQL in a Docker container on port 5432.

### 5. Generate Prisma Client

```bash
cd services/api
pnpm db:generate
```

### 6. Run Database Migrations

```bash
pnpm db:migrate
```

This creates all tables in your PostgreSQL database.

### 7. (Optional) Seed Database

```bash
pnpm db:seed
```

This populates the database with sample data (roles, departments, users, etc.).

### 8. Build the API

```bash
pnpm build
```

Compiles TypeScript to JavaScript.

### 9. Start Development Server

```bash
pnpm dev
```

The API will start on `http://localhost:3000`.

---

## Verify Setup

### Health Check

Open your browser or use curl:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T09:27:54.791Z"
}
```

### Test Authentication

**Register a user:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": "<role-id-from-seed>",
    "departmentId": "<dept-id-from-seed>"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

You should receive an access token and user details.

---

## Development Workflow

### Run API in Watch Mode

```bash
cd services/api
pnpm dev
```

The server automatically restarts when you save files.

### View Database with Prisma Studio

```bash
cd services/api
pnpm db:studio
```

Opens a visual database browser at `http://localhost:5555`.

### Run Tests

```bash
cd services/api
pnpm test
```

### Lint Code

```bash
cd services/api
pnpm lint
```

### Format Code

```bash
pnpm format
```

---

## Project Structure

```
BFCL_Safety_App/
├── services/
│   └── api/                     # Express + TypeScript API
│       ├── prisma/
│       │   ├── schema.prisma    # Database schema
│       │   ├── migrations/      # Database migrations
│       │   └── seed.ts          # Seed data
│       ├── src/
│       │   ├── controllers/     # Request handlers
│       │   ├── services/        # Business logic
│       │   ├── routes/          # API routes
│       │   ├── middlewares/     # Express middleware
│       │   ├── utils/           # Utilities
│       │   └── index.ts         # Entry point
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/                  # Shared types and utilities
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # pnpm workspace config
├── docker-compose.yml           # Docker services
├── DEVELOPMENT_ROADMAP.md       # Complete development plan
├── NEXT_STEPS.md               # Detailed next steps
└── README.md                    # Project overview
```

---

## Key Files to Know

### Database Schema
`services/api/prisma/schema.prisma`
- Complete database model with all entities

### API Entry Point
`services/api/src/index.ts`
- Express server setup
- Middleware configuration
- Route registration

### Services (Business Logic)
`services/api/src/services/`
- ✅ `auth.service.ts` - Authentication
- ✅ `incident.service.ts` - Incident management
- ✅ `investigation.service.ts` - Investigation workflow
- ✅ `hazard.service.ts` - Hazard identification
- ❌ `audit.service.ts` - Not yet implemented
- ❌ `training.service.ts` - Not yet implemented
- ❌ `ppe.service.ts` - Not yet implemented
- ❌ `mockDrill.service.ts` - Not yet implemented
- ❌ `report.service.ts` - Not yet implemented
- ❌ `notification.service.ts` - Not yet implemented
- ❌ `user.service.ts` - Not yet implemented

### Controllers (API Handlers)
`services/api/src/controllers/`
- ✅ `auth.controller.ts` - Fully implemented
- ✅ `incident.controller.ts` - Fully implemented
- ❌ Others - Stub implementations (return 501)

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | API server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | Token expiry duration | 7d |
| `ALLOWED_ORIGINS` | CORS allowed origins | * |
| `MAX_FILE_SIZE` | Max upload file size (bytes) | 10485760 (10MB) |
| `UPLOAD_DIR` | Upload directory path | ./uploads |
| `LOG_LEVEL` | Logging level (info/debug/error) | info |

---

## Common Commands

### Workspace (Root Level)

```bash
# Install all dependencies
pnpm install

# Run all services in development
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Run all tests
pnpm test
```

### API Service Only

```bash
# Run API in development
pnpm api:dev

# Build API
cd services/api && pnpm build

# Run database migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

---

## Troubleshooting

### Database Connection Errors

**Problem:** Cannot connect to PostgreSQL

**Solution:**
1. Ensure Docker is running: `docker ps`
2. Check if PostgreSQL container is up: `docker-compose ps`
3. Restart PostgreSQL: `docker-compose restart postgres`
4. Verify DATABASE_URL in `.env`

### Prisma Client Not Found

**Problem:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd services/api
pnpm db:generate
```

### TypeScript Build Errors

**Problem:** Type errors during build

**Solution:**
```bash
cd services/api
pnpm install
pnpm db:generate
pnpm build
```

### Port Already in Use

**Problem:** `Port 3000 is already in use`

**Solution:**
1. Find process: `lsof -i :3000` (Mac/Linux) or `netstat -ano | findstr :3000` (Windows)
2. Kill process or change PORT in `.env`

---

## API Testing with Postman

### Import Collection

1. Download Postman: https://www.postman.com/downloads/
2. Import the API endpoints (create a collection manually or use generated OpenAPI spec)
3. Set base URL: `http://localhost:3000/api/v1`

### Authentication Flow

1. **Register** → Get access token
2. **Login** → Get access token
3. Add token to subsequent requests:
   ```
   Authorization: Bearer <your-access-token>
   ```

### Sample Requests

**Create Incident:**
```http
POST /api/v1/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "incidentDate": "2025-10-27T10:00:00Z",
  "incidentTime": "10:00",
  "location": "Assembly Line 2",
  "incidentType": "INJURY",
  "severity": "MEDIUM",
  "description": "Worker slipped on wet floor",
  "propertyDamage": false
}
```

**Get All Incidents:**
```http
GET /api/v1/incidents?page=1&limit=10&status=OPEN
Authorization: Bearer <token>
```

---

## Next Steps After Setup

1. **Familiarize yourself** with the codebase structure
2. **Read** `DEVELOPMENT_ROADMAP.md` for the complete plan
3. **Read** `NEXT_STEPS.md` for immediate tasks
4. **Choose a service** to implement (see NEXT_STEPS.md)
5. **Follow patterns** from existing services (Investigation, Hazard)
6. **Write tests** as you code
7. **Commit frequently** with clear messages

---

## Useful Resources

- **Prisma Docs:** https://www.prisma.io/docs/
- **Express.js Docs:** https://expressjs.com/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **Zod Validation:** https://zod.dev/
- **JWT:** https://jwt.io/

---

## Need Help?

- Check `README.md` for project overview
- Check `DEVELOPMENT_ROADMAP.md` for technical requirements
- Check `NEXT_STEPS.md` for implementation guidance
- Review existing service implementations
- Create an issue on GitHub

---

**Happy Coding! 🚀**

Last Updated: 2025-10-27
