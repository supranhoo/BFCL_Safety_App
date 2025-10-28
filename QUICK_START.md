# Quick Start Guide - BFCL Safety Management System

## Login Issue Resolution

This document explains how to fix the "Login failed" issue and get the system running.

## Root Cause

The login failure was caused by:
1. **Missing `.env` file** - Environment configuration was not set up
2. **Database not initialized** - PostgreSQL container was not running
3. **No seeded data** - Default admin user was not created
4. **API server not started** - Backend service was not running

## Solution

### Automated Setup (Recommended)

Run the automated setup script:

```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

This will:
- Install all dependencies
- Create `.env` file
- Start PostgreSQL database
- Run database migrations
- Seed default admin user
- Provide next steps

### Manual Setup

If you prefer manual setup, follow these steps:

#### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

#### 2. Create Environment File

```bash
# Copy the example env file
cp services/api/.env.example services/api/.env

# The default values work for local development
# No changes needed unless using custom configuration
```

#### 3. Start PostgreSQL Database

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Wait for database to be ready (about 5-10 seconds)
sleep 5

# Verify database is running
docker ps | grep bfcl-postgres
```

#### 4. Setup Database

```bash
# Generate Prisma Client
cd services/api
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed default data (includes admin user)
pnpm db:seed

cd ../..
```

#### 5. Start API Server

```bash
# Start the API server
pnpm api:dev
```

The server will start on `http://localhost:3000`

## Default Login Credentials

After setup, you can login with:

- **Email**: `admin@bfcl.com`
- **Password**: `Admin@123`

**⚠️ IMPORTANT**: Change this password in production!

## Verification

### Test Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T09:47:35.864Z"
}
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bfcl.com","password":"Admin@123"}'
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "email": "admin@bfcl.com",
    "username": "admin",
    "firstName": "System",
    "lastName": "Admin",
    "role": {
      "name": "Safety Head",
      "level": 5
    }
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Test Protected Endpoint

```bash
# First, get the token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bfcl.com","password":"Admin@123"}' | jq -r .accessToken)

# Use the token to access protected endpoint
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues & Solutions

### Issue: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
```

### Issue: "docker: command not found"

**Solution:** Install Docker Desktop from https://www.docker.com/products/docker-desktop

### Issue: "Port 5432 already in use"

**Solution:** Stop any existing PostgreSQL instance:
```bash
# On Mac/Linux
sudo service postgresql stop

# On Windows
# Stop PostgreSQL service from Services panel

# Or use a different port in .env file:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bfcl_safety?schema=public"
```

### Issue: "Port 3000 already in use"

**Solution:** Change the port in `services/api/.env`:
```env
PORT=3001
```

### Issue: Migration fails with "database does not exist"

**Solution:** The database is created automatically by the migration. If it still fails:
```bash
# Stop and remove the container
docker compose down -v

# Start fresh
docker compose up -d postgres
sleep 5

# Run migrations again
cd services/api && pnpm db:migrate
```

### Issue: "Invalid credentials" even with correct password

**Solution:** The database might not be seeded. Run:
```bash
cd services/api && pnpm db:seed
```

## Database Management

### Access Prisma Studio

```bash
pnpm db:studio
```

Opens at `http://localhost:5555` - A visual database browser

### View Database Logs

```bash
docker logs bfcl-postgres
```

### Connect to Database

```bash
docker exec -it bfcl-postgres psql -U postgres -d bfcl_safety
```

### Reset Database

```bash
# Stop API server (Ctrl+C)

# Remove containers and volumes
docker compose down -v

# Start fresh
docker compose up -d postgres
sleep 5

# Re-run migrations and seed
cd services/api
pnpm db:migrate
pnpm db:seed
```

## Starting the Application

### Start All Services

```bash
# Terminal 1: Start API
pnpm api:dev

# Terminal 2: Start Web App
pnpm web:dev
```

### Access Points

- **API Server**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **API Docs**: See `API_DOCUMENTATION.md`
- **Web App**: http://localhost:5173 (Vite default)
- **Prisma Studio**: http://localhost:5555 (when running)

## Development Workflow

1. **Make changes** to code
2. **Test** with curl or Postman
3. **Check logs** in terminal
4. **Use Prisma Studio** to inspect database
5. **Commit changes** when verified

## Environment Variables

The `.env` file contains:

```env
# Database connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bfcl_safety?schema=public"

# Server configuration
PORT=3000
NODE_ENV=development

# JWT authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS - allowed origins for frontend
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002,http://localhost:5173

# Seed admin password
SEED_ADMIN_PASSWORD=Admin@123
```

## Security Notes

### For Development

- Default credentials are fine
- Default JWT secret is acceptable
- CORS is open to localhost origins

### For Production

**⚠️ MUST CHANGE:**
1. **Admin password** - Use strong password
2. **JWT_SECRET** - Use cryptographically secure random string
3. **DATABASE_URL** - Use production database credentials
4. **ALLOWED_ORIGINS** - Set to your production domain
5. **Enable HTTPS** - Always use TLS in production

## Next Steps

1. ✅ System is now running
2. ✅ Can login with admin credentials
3. ✅ API is accessible

**Recommended next steps:**
1. Explore API endpoints (see `API_DOCUMENTATION.md`)
2. Start the web frontend: `pnpm web:dev`
3. Create additional users with different roles
4. Test incident reporting workflow
5. Review the database schema in Prisma Studio

## Support

If you continue to experience issues:

1. Check all containers are running: `docker ps`
2. Check API logs for errors
3. Verify database connectivity
4. Review `.env` configuration
5. Try the reset database steps above

For more information, see:
- `README.md` - Complete documentation
- `API_DOCUMENTATION.md` - API reference
- `PROGRESS_REPORT.md` - Development status

---

**Last Updated**: October 28, 2025
**Status**: ✅ Login issue resolved
