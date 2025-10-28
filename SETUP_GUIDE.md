# BFCL Safety Management System - Setup Guide

This guide will help you set up and run the BFCL Safety Management System locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Docker** and **Docker Compose** (for PostgreSQL database)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/supranhoo/BFCL_Safety_App.git
cd BFCL_Safety_App
```

### 2. Install pnpm (if not already installed)

```bash
npm install -g pnpm
```

### 3. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the monorepo including the API service, web app, and shared packages.

### 4. Set Up Environment Variables

Create a `.env` file in the `services/api/` directory:

```bash
cp services/api/.env.example services/api/.env
```

Edit `services/api/.env` with the following configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bfcl_safety?schema=public"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=bfcl-safety-secret-key-dev-2025
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info

# CORS - Add your frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001,http://localhost:3002

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@bfcl.com
SMTP_PASS=

# Azure AD (SSO) - Optional
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=

# Seed Admin Password
SEED_ADMIN_PASSWORD=Admin@123
```

**Important Notes:**
- Change `JWT_SECRET` to a strong random string in production
- Update `ALLOWED_ORIGINS` to match your frontend URL
- Never commit the `.env` file to version control (it's in `.gitignore`)

### 5. Start PostgreSQL Database

```bash
docker compose up -d postgres
```

Wait a few seconds for the database to be ready. You can check the status with:

```bash
docker compose ps
```

### 6. Generate Prisma Client

```bash
cd services/api
pnpm db:generate
cd ../..
```

### 7. Run Database Migrations

```bash
pnpm db:migrate
```

This will create all the necessary tables in the PostgreSQL database.

### 8. Seed the Database (Optional but Recommended)

```bash
pnpm db:seed
```

This will create:
- Default roles (Safety Head, Assistant Safety Manager, etc.)
- A Safety department
- An admin user with credentials:
  - **Email:** admin@bfcl.com
  - **Password:** Admin@123

### 9. Start the API Server

In a new terminal window:

```bash
# From the root directory
pnpm api:dev

# OR directly from the API directory
cd services/api
pnpm dev
```

The API will start on `http://localhost:3000`

You can verify it's running by visiting: `http://localhost:3000/health`

### 10. Start the Web Application

In another terminal window:

```bash
# From the root directory
cd apps/web
pnpm dev
```

The web app will start on `http://localhost:5173`

### 11. Access the Application

Open your browser and navigate to: `http://localhost:5173`

**Login Credentials:**
- Email: `admin@bfcl.com`
- Password: `Admin@123`

## Troubleshooting

### Port Already in Use

If you get an error that port 3000 or 5173 is already in use:

```bash
# Kill process on port 3000 (API)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (Web)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues

If you can't connect to the database:

1. Check if PostgreSQL is running:
   ```bash
   docker compose ps
   ```

2. Restart the database:
   ```bash
   docker compose restart postgres
   ```

3. Check the logs:
   ```bash
   docker compose logs postgres
   ```

### Prisma Client Issues

If you see errors about Prisma Client not being generated:

```bash
cd services/api
pnpm db:generate
```

### Migration Issues

If migrations fail, you can reset the database (WARNING: This will delete all data):

```bash
cd services/api
npx prisma migrate reset
```

## Development Commands

### Run All Services (API + Web)

```bash
pnpm dev
```

### Run Individual Services

```bash
# API only
pnpm api:dev

# Web only
pnpm web:dev
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
pnpm db:studio

# Create a new migration
pnpm db:migrate

# Reset database (WARNING: Deletes all data)
cd services/api && npx prisma migrate reset
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Architecture Overview

```
BFCL_Safety_App/
├── apps/
│   └── web/              # React frontend (Vite + React)
├── services/
│   └── api/              # Express backend (Node.js + TypeScript + Prisma)
├── packages/
│   └── shared/           # Shared types and utilities
└── docker-compose.yml    # PostgreSQL database configuration
```

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS, React Router, Zustand
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL 15
- **Authentication:** JWT (JSON Web Tokens)
- **Package Manager:** pnpm (monorepo with workspaces)

## Default Ports

- **Web App:** http://localhost:5173
- **API Server:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Prisma Studio:** http://localhost:5555 (when running `pnpm db:studio`)

## API Endpoints

- Health Check: `GET http://localhost:3000/health`
- Login: `POST http://localhost:3000/api/v1/auth/login`
- Register: `POST http://localhost:3000/api/v1/auth/register`
- Get User: `GET http://localhost:3000/api/v1/auth/me`

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Next Steps

Once you're up and running:

1. Explore the dashboard
2. Create test incidents
3. Review the incident management workflow
4. Check out the hazard identification module
5. Explore the training and certification tracking

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review the [README.md](./README.md)
3. Check the API logs in the terminal
4. Open an issue on GitHub

## Production Deployment

For production deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

**Remember:**
- Never use development secrets in production
- Always use HTTPS in production
- Set `NODE_ENV=production`
- Use a managed PostgreSQL service (AWS RDS, Azure Database, etc.)
- Implement proper monitoring and logging

---

**Happy Coding! 🚀**
