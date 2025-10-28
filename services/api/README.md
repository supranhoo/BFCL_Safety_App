# BFCL Safety API

Backend API service for the BFCL Safety Management System.

## Quick Setup

### 1. Environment Configuration

```bash
# Copy environment example
cp .env.example .env

# Default values work for local development
```

### 2. Database Setup

Make sure PostgreSQL is running (via Docker):

```bash
# From project root
docker compose up -d postgres
```

### 3. Database Migrations

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed default data
pnpm db:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Server runs on `http://localhost:3000`

## Default Admin Credentials

- **Email**: admin@bfcl.com
- **Password**: Admin@123

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:seed` - Seed database with default data
- `pnpm db:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/change-password` - Change password

### Incidents
- `POST /api/v1/incidents` - Create incident
- `GET /api/v1/incidents` - List incidents
- `GET /api/v1/incidents/:id` - Get incident
- `PUT /api/v1/incidents/:id` - Update incident
- `DELETE /api/v1/incidents/:id` - Delete incident

### Other Modules
- `/api/v1/investigations` - Investigation management
- `/api/v1/hazards` - Hazard identification
- `/api/v1/audits` - Audit & inspections
- `/api/v1/training` - Training programs
- `/api/v1/ppe` - PPE management
- `/api/v1/mock-drills` - Emergency drills
- `/api/v1/reports` - Analytics & reports
- `/api/v1/users` - User management
- `/api/v1/notifications` - Notifications

See `API_DOCUMENTATION.md` in project root for complete API reference.

## Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bfcl.com","password":"Admin@123"}'
```

### Access Protected Endpoint

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bfcl.com","password":"Admin@123"}' | jq -r .accessToken)

# Use token
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

See `.env.example` for all available variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time
- `ALLOWED_ORIGINS` - CORS allowed origins

## Database Schema

The database schema includes:

- **Users & Roles** - User management with RBAC
- **Incidents** - Incident reporting and tracking
- **Investigations** - Incident investigations with RCA
- **Hazards** - Hazard identification and risk assessment
- **Audits** - Safety audits and inspections
- **Training** - Training programs and certifications
- **PPE** - PPE inventory and issuance
- **Mock Drills** - Emergency drill management
- **Corrective Actions** - CAPA tracking
- **Notifications** - User notifications
- **Audit Logs** - System audit trail

See `prisma/schema.prisma` for complete schema definition.

## Development

### Database Management

```bash
# Open Prisma Studio
pnpm db:studio

# Create new migration
pnpm db:migrate

# Reset database
docker compose down -v
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

### Debugging

The API uses Winston for logging. Logs include:
- Request/response information
- Database queries
- Errors and stack traces

Check console output for debugging information.

## Security

### Development
- Default credentials for testing
- Permissive CORS for localhost
- Default JWT secret

### Production
**⚠️ MUST CONFIGURE:**
- Strong admin password
- Secure JWT secret (use `openssl rand -base64 32`)
- Strict CORS origins
- HTTPS/TLS encryption
- Environment variable protection
- Rate limiting configuration
- Database connection over TLS

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Auth**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep bfcl-postgres

# Check logs
docker logs bfcl-postgres

# Restart database
docker compose restart postgres
```

### Migration Errors

```bash
# Reset database
docker compose down -v
docker compose up -d postgres
sleep 5
pnpm db:migrate
```

### Port Already in Use

Change `PORT` in `.env` file to use a different port.

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request

## License

Copyright © 2025 BFCL. All rights reserved.
