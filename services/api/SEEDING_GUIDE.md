# Database Seeding Guide

⚠️ **IMPORTANT**: This seeding guide and script are designed exclusively for **development and testing environments**. Do NOT use in production!

This guide explains how to seed the BFCL Safety Management System database with demo data for development and testing purposes.

## Quick Start

```bash
# From the project root
pnpm db:seed

# Or from the services/api directory
cd services/api
pnpm db:seed
```

## What Gets Seeded

The seed script (`prisma/seed.ts`) populates the database with comprehensive demo data to showcase all features of the safety management system.

### 1. Users (8 users)
- **System Admin** - admin@bfcl.com (Safety Head)
- **John Smith** - asm@bfcl.com (Assistant Safety Manager)
- **Sarah Johnson** - sso@bfcl.com (Senior Safety Officer)
- **Mike Williams** - so1@bfcl.com (Safety Officer)
- **Emily Davis** - so2@bfcl.com (Safety Officer)
- **David Brown** - worker1@bfcl.com (Worker)
- **Lisa Garcia** - worker2@bfcl.com (Worker)
- **Robert Martinez** - contractor1@bfcl.com (Contractor)

**Default Password for all users:** `Admin@123`

⚠️ **DEVELOPMENT ONLY**: These are weak test passwords. Never use these credentials in production!

### 2. Departments (5 departments)
- Safety (SAF)
- Production (PROD)
- Maintenance (MAINT)
- Engineering (ENG)
- Quality Control (QC)

### 3. Incidents (5 incidents)
Examples of different incident types and severities:
- **INC-2025-0001**: HIGH severity - Worker hand cut (Under Investigation)
- **INC-2025-0002**: MEDIUM severity - Crane near-miss (Under Review)
- **INC-2025-0003**: LOW severity - Tool cabinet fall (Closed)
- **INC-2025-0004**: CRITICAL severity - Chemical spill (Under Investigation)
- **INC-2025-0005**: MEDIUM severity - Forklift near-collision (Submitted)

### 4. Hazards (3 hazards)
- **HAZ-2025-0001**: HIGH risk - Exposed conveyor belt parts
- **HAZ-2025-0002**: EXTREME risk - Electrical panel door issue
- **HAZ-2025-0003**: MEDIUM risk - Chemical storage ventilation

### 5. Investigations (1 investigation)
- **INV-2025-0001**: Investigation for INC-2025-0001 with root cause analysis and 5-Whys

### 6. Corrective Actions - CAPAs (5 actions)
- **CAPA-2025-0001**: Install machine guarding (In Progress)
- **CAPA-2025-0002**: LOTO training (In Progress)
- **CAPA-2025-0003**: Repair electrical panel (OVERDUE)
- **CAPA-2025-0004**: Install conveyor guarding (OVERDUE)
- **CAPA-2025-0005**: Install ventilation (Pending)

### 7. Training Programs (4 programs)
- Safety Induction Training
- Lockout/Tagout (LOTO) Certification
- Fire Safety and Emergency Response
- Forklift Operation Safety

### 8. Training Sessions (3 scheduled sessions)
- **TRN-2025-0001**: Safety Induction - Feb 10, 2025
- **TRN-2025-0002**: LOTO Certification - Feb 15, 2025
- **TRN-2025-0003**: Fire Safety - Feb 20, 2025

### 9. Audits (2 scheduled audits)
- **AUD-2025-0001**: Q1 PPE Compliance Inspection
- **AUD-2025-0002**: Fire Safety Equipment Check

### 10. PPE Items (5 items)
- Safety Helmet - White (150 in stock)
- Safety Goggles - Clear (200 in stock)
- Ear Plugs - Disposable (1000 in stock)
- Safety Gloves - Leather (80 in stock)
- Safety Boots - Steel Toe (45 in stock)

### 11. PPE Issuances (2 issuances)
- Safety helmet issued to David Brown
- Safety gloves issued to Lisa Garcia

### 12. Mock Drills (2 scheduled drills)
- **DRILL-2025-0001**: Fire Drill - Feb 15, 2025
- **DRILL-2025-0002**: Chemical Spill Response - Feb 25, 2025

### 13. Certifications (3 certifications)
- Forklift Operation - David Brown (Expires Feb 1, 2025)
- First Aid - Lisa Garcia (Expires Feb 10, 2025)
- Confined Space Entry - Robert Martinez (Expires Feb 20, 2025)

## Dashboard Metrics

After seeding, the dashboard will show:
- **Total Incidents**: 5
- **Open Incidents**: 4
- **Open CAPAs**: 5
- **Overdue CAPAs**: 2
- **Open Hazards**: 3
- **High Severity Open Incidents**: 2
- **Recent Incidents**: 5 most recent

## Environment Variables

The seed script respects the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `SEED_ADMIN_PASSWORD`: Password for all seeded users (default: "Admin@123")

## Upsert Behavior

The seed script uses `upsert` operations for roles, departments, and users, which means:
- Running the seed script multiple times is safe
- Existing data won't be duplicated
- New data will be created only if it doesn't exist

## Testing the Seeded Data

1. **Login to the system**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@bfcl.com","password":"Admin@123"}'
   ```

2. **Get dashboard data**:
   ```bash
   # Use the accessToken from login response
   curl -X GET http://localhost:3000/api/v1/reports/dashboard \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Resetting the Database

To reset the database and re-seed:

```bash
# From project root
pnpm db:migrate:reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run the seed script automatically
```

## Production Considerations

⚠️ **WARNING**: This seed script is designed for development and testing only.

**DO NOT run this in production** as it:
- Uses weak default passwords
- Creates test data that may not be appropriate for production
- Could overwrite existing production data

For production:
1. Create initial admin users manually
2. Use strong, unique passwords
3. Set up proper role-based access control
4. Import real organizational data carefully

## Customizing the Seed Data

To customize the seed data:

1. Edit `services/api/prisma/seed.ts`
2. Modify the data arrays (users, incidents, hazards, etc.)
3. Run `pnpm db:seed` to apply changes

Example - Adding more users:
```typescript
const users = [
  // ... existing users ...
  { 
    email: 'newuser@bfcl.com', 
    username: 'newuser', 
    firstName: 'New', 
    lastName: 'User', 
    role: 'Safety Officer', 
    dept: 'SAF', 
    employeeId: 'EMP009' 
  },
];
```

## Troubleshooting

### Error: Port already in use
If you see "Port 3000 is already in use", kill the existing process:
```bash
# First try graceful shutdown (SIGTERM)
lsof -ti:3000 | xargs kill

# If process doesn't stop, force kill (SIGKILL) as last resort
lsof -ti:3000 | xargs kill -9
```

### Error: Database connection failed
Ensure PostgreSQL is running:
```bash
docker compose up -d postgres
# Wait for database to be ready
docker compose ps
```

### Error: Prisma Client not generated
Generate the Prisma Client:
```bash
cd services/api
pnpm db:generate
```

## Support

For issues or questions about seeding:
1. Check the logs in the console output
2. Verify database connection in `.env` file
3. Ensure all migrations are up to date: `pnpm db:migrate`
4. Review the seed script: `services/api/prisma/seed.ts`
