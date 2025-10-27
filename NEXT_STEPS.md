# Next Steps for BFCL Safety Management System Development

## Executive Summary

The BFCL Safety Management System backend API has been successfully scaffolded with a solid foundation. **Phase 1 is complete**, and we're **36% through Phase 2** (Service Layer Implementation). This document outlines the specific tasks, objectives, and deliverables needed to complete the project.

---

## Current Status

### ✅ Completed (Phase 1 - Foundation)

1. **Infrastructure Setup**
   - Monorepo structure with pnpm workspaces
   - TypeScript configuration with proper build setup
   - ESLint and Prettier configuration
   - Docker Compose for local development
   - PostgreSQL database configuration

2. **Database Layer**
   - Complete Prisma schema with 20+ entities
   - Initial migration created and ready
   - Prisma Client generated
   - All relationships defined

3. **API Foundation**
   - Express server with TypeScript
   - Complete route structure for 11 modules
   - Core middleware: Rate limiting, CORS, Helmet, Error handling
   - Basic audit logging middleware

4. **Services Implemented** (4 of 11)
   - ✅ Authentication Service (JWT-based auth, register, login, refresh)
   - ✅ Incident Service (CRUD, workflow management, OSHA compliance)
   - ✅ Investigation Service (RCA, 5-Whys, CAPA generation, approval workflow)
   - ✅ Hazard Service (Risk matrix, hazard register, control measures)

---

## Immediate Next Steps (Priority 0 - Critical)

### 1. Complete Service Layer Implementation (7 services remaining)

#### 1.1 Audit Service (Estimated: 1.5 days)
**File:** `services/api/src/services/audit.service.ts`

**Key Features:**
- Schedule audits with digital checklists
- Support audit types: PPE, 5S, Fire Safety, Electrical, Machine Safety, Housekeeping
- Checkpoint-based evaluation (Compliant, Non-Compliant, Observation, N/A)
- Compliance score calculation: `(Compliant / Total) × 100`
- NCR (Non-Conformance Report) generation
- Auto-create CAPAs for non-compliances
- Status workflow: SCHEDULED → IN_PROGRESS → COMPLETED → UNDER_REVIEW → CLOSED

**Endpoints to implement:**
```typescript
createAudit()           // POST /api/v1/audits
getAllAudits()          // GET /api/v1/audits (with filters)
getAuditById()          // GET /api/v1/audits/:id
updateAudit()           // PUT /api/v1/audits/:id
completeAudit()         // POST /api/v1/audits/:id/complete
addCheckpoint()         // POST /api/v1/audits/:id/checkpoints
updateCheckpoint()      // PUT /api/v1/audits/:id/checkpoints/:checkpointId
getStatistics()         // Internal method
```

**Business Rules:**
- Passing score: 85%
- Each non-compliance should generate a CAPA suggestion
- Auditor must be a Safety Officer or above
- Cannot complete audit if checkpoints are not evaluated

---

#### 1.2 Training Service (Estimated: 1.5 days)
**File:** `services/api/src/services/training.service.ts`

**Key Features:**
- Training program management (INDUCTION, REFRESHER, SKILL_BASED, COMPLIANCE, etc.)
- Session scheduling with capacity management
- Attendance tracking with quiz/assessment
- Certificate generation and issuance
- Expiry tracking (alert 30 days before)
- Mandatory training enforcement by role
- Training completion reports

**Endpoints to implement:**
```typescript
// Programs
createProgram()         // POST /api/v1/training/programs
getAllPrograms()        // GET /api/v1/training/programs
getProgramById()        // GET /api/v1/training/programs/:id
updateProgram()         // PUT /api/v1/training/programs/:id
deleteProgram()         // DELETE /api/v1/training/programs/:id

// Sessions
createSession()         // POST /api/v1/training/sessions
getAllSessions()        // GET /api/v1/training/sessions
getSessionById()        // GET /api/v1/training/sessions/:id
updateSession()         // PUT /api/v1/training/sessions/:id
completeSession()       // POST /api/v1/training/sessions/:id/complete
markAttendance()        // POST /api/v1/training/sessions/:id/attendance
updateAttendance()      // PUT /api/v1/training/sessions/:id/attendance/:userId

// Certifications
getUserCertifications() // GET /api/v1/training/certifications/user/:userId
getExpiringCerts()      // GET /api/v1/training/certifications/expiring
```

**Business Rules:**
- Cannot mark session complete if attendance not recorded
- Quiz passing score determines certificate issuance
- Certificates auto-expire based on validity period
- Notifications sent 30 days before expiry

---

#### 1.3 PPE Service (Estimated: 1 day)
**File:** `services/api/src/services/ppe.service.ts`

**Key Features:**
- PPE inventory management (stock tracking)
- Issuance and return processing
- Stock alerts when below reorder level
- Expiry tracking for time-based PPE
- Analyzer calibration tracking
- User PPE history

**Endpoints to implement:**
```typescript
// Items
createItem()            // POST /api/v1/ppe/items
getAllItems()           // GET /api/v1/ppe/items
getItemById()           // GET /api/v1/ppe/items/:id
updateItem()            // PUT /api/v1/ppe/items/:id
deleteItem()            // DELETE /api/v1/ppe/items/:id

// Issuances
createIssuance()        // POST /api/v1/ppe/issuances
getAllIssuances()       // GET /api/v1/ppe/issuances
getIssuanceById()       // GET /api/v1/ppe/issuances/:id
returnPPE()             // POST /api/v1/ppe/issuances/:id/return
getUserIssuances()      // GET /api/v1/ppe/issuances/user/:userId

// Inventory
getLowStock()           // GET /api/v1/ppe/inventory/low-stock

// Calibrations
createCalibration()     // POST /api/v1/ppe/calibrations
getAllCalibrations()    // GET /api/v1/ppe/calibrations
getCalibrationById()    // GET /api/v1/ppe/calibrations/:id
updateCalibration()     // PUT /api/v1/ppe/calibrations/:id
```

**Business Rules:**
- Auto-deduct stock on issuance
- Auto-add stock on return (if condition is good)
- Alert when stock < reorder level
- Track calibration status: VALID, DUE_SOON (< 30 days), OVERDUE, EXPIRED

---

#### 1.4 Mock Drill Service (Estimated: 0.5 days)
**File:** `services/api/src/services/mockDrill.service.ts`

**Key Features:**
- Schedule emergency drills (Fire, Earthquake, Chemical Spill, Medical, Evacuation, Lockdown)
- Participant management and attendance
- Performance evaluation (Good, Fair, Poor)
- Observer assignment
- Gap analysis and recommendations
- Drill completion with rating

**Endpoints to implement:**
```typescript
createDrill()           // POST /api/v1/mock-drills
getAllDrills()          // GET /api/v1/mock-drills
getDrillById()          // GET /api/v1/mock-drills/:id
updateDrill()           // PUT /api/v1/mock-drills/:id
completeDrill()         // POST /api/v1/mock-drills/:id/complete
addParticipant()        // POST /api/v1/mock-drills/:id/participants
updateParticipant()     // PUT /api/v1/mock-drills/:id/participants/:userId
getStatistics()         // Internal method
```

---

#### 1.5 Report Service (Estimated: 1.5 days)
**File:** `services/api/src/services/report.service.ts`

**Key Features:**
- Dashboard statistics (incident trends, KPIs)
- OSHA 300/301 log generation
- Incident reports by type/severity/department/date range
- CAPA aging reports
- Training completion reports
- Compliance reports
- KPI calculations: LTIFR, TRIR

**Endpoints to implement:**
```typescript
getDashboard()          // GET /api/v1/reports/dashboard
getIncidentReport()     // GET /api/v1/reports/incidents
getOSHALog()            // GET /api/v1/reports/osha-log
getKPIReport()          // GET /api/v1/reports/kpi
getCAPAAgingReport()    // GET /api/v1/reports/capa-aging
getTrainingCompletion() // GET /api/v1/reports/training-completion
getComplianceReport()   // GET /api/v1/reports/compliance
```

**KPI Formulas:**
```
LTIFR = (Lost Time Injuries × 1,000,000) / Total Hours Worked
TRIR = (Total Recordable Incidents × 200,000) / Total Hours Worked
DART Rate = (Days Away, Restricted, or Transfer × 200,000) / Total Hours Worked
```

---

#### 1.6 Notification Service (Estimated: 0.5 days)
**File:** `services/api/src/services/notification.service.ts`

**Key Features:**
- Create notifications for various events
- Mark as read/unread
- Bulk operations (mark all as read)
- Filter by type and status
- Auto-notification triggers

**Endpoints to implement:**
```typescript
createNotification()    // Internal method
getAll()                // GET /api/v1/notifications
getById()               // GET /api/v1/notifications/:id
markAsRead()            // PUT /api/v1/notifications/:id/read
markAllAsRead()         // PUT /api/v1/notifications/read-all
delete()                // DELETE /api/v1/notifications/:id
```

**Notification Types:**
- Incident assigned
- Investigation required
- CAPA assigned/overdue
- Training scheduled
- Certification expiring
- Audit scheduled
- Drill scheduled
- Approval required

---

#### 1.7 User Service (Estimated: 0.5 days)
**File:** `services/api/src/services/user.service.ts`

**Key Features:**
- User management (CRUD)
- Role and department assignment
- Profile management
- Active/inactive status management
- User search and filtering

**Endpoints to implement:**
```typescript
create()                // POST /api/v1/users
getAll()                // GET /api/v1/users
getById()               // GET /api/v1/users/:id
update()                // PUT /api/v1/users/:id
delete()                // DELETE /api/v1/users/:id
deactivate()            // PUT /api/v1/users/:id/deactivate
activate()              // PUT /api/v1/users/:id/activate
```

---

### 2. Implement Controllers (Estimated: 3-4 days)

For each service, update the corresponding controller stub to:

1. **Import the service class**
2. **Add request validation** using Zod schemas
3. **Extract authenticated user** from `req.user`
4. **Call service methods** with proper error handling
5. **Format responses** consistently
6. **Add pagination support** where applicable

**Files to update:**
```
services/api/src/controllers/investigation.controller.ts
services/api/src/controllers/hazard.controller.ts
services/api/src/controllers/audit.controller.ts
services/api/src/controllers/training.controller.ts
services/api/src/controllers/ppe.controller.ts
services/api/src/controllers/mockDrill.controller.ts
services/api/src/controllers/report.controller.ts
services/api/src/controllers/notification.controller.ts
services/api/src/controllers/user.controller.ts
```

**Controller Template:**
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ServiceName } from '../services/serviceName.service';
import { z } from 'zod';

const service = new ServiceName();

// Validation schema
const createSchema = z.object({
  field1: z.string(),
  field2: z.number().optional(),
  // ... other fields
});

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createSchema.parse(req.body);
    const result = await service.create(validated, req.user!.id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ... other controller methods
```

---

### 3. Add Missing Middleware (Estimated: 2 days)

#### 3.1 Authorization Middleware ⚠️ CRITICAL
**File:** `services/api/src/middlewares/authorization.middleware.ts`

Implement Role-Based Access Control (RBAC):

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';

// Role hierarchy
const ROLE_LEVELS = {
  'Worker/Contractor': 0,
  'Assistant Safety Officer': 1,
  'Safety Officer': 2,
  'Senior Safety Officer': 3,
  'Assistant Safety Manager (ASM)': 4,
  'Safety Head': 5,
};

export const requireRole = (minRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const userLevel = ROLE_LEVELS[userRole as keyof typeof ROLE_LEVELS] || 0;
    const requiredLevel = ROLE_LEVELS[minRole as keyof typeof ROLE_LEVELS];

    if (userLevel < requiredLevel) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const permissions = req.user?.permissions || [];
    
    if (!permissions.includes(permission)) {
      throw new AppError('Missing required permission', 403);
    }

    next();
  };
};
```

**Usage in routes:**
```typescript
router.post('/audits', authenticate, requireRole('Safety Officer'), createAudit);
router.post('/investigations/:id/approve', authenticate, requireRole('ASM'), approveInvestigation);
```

---

#### 3.2 Validation Middleware
**Directory:** `services/api/src/middlewares/validation/`

Create Zod schemas for all request bodies:

**Files to create:**
```
validation/incident.validation.ts
validation/investigation.validation.ts
validation/hazard.validation.ts
validation/audit.validation.ts
validation/training.validation.ts
validation/ppe.validation.ts
validation/mockDrill.validation.ts
```

**Example:** `validation/incident.validation.ts`
```typescript
import { z } from 'zod';

export const createIncidentSchema = z.object({
  incidentDate: z.string().datetime(),
  incidentTime: z.string(),
  location: z.string().min(1),
  geoLocation: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  incidentType: z.enum(['INJURY', 'ILLNESS', 'NEAR_MISS', 'PROPERTY_DAMAGE', 'ENVIRONMENTAL']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  injuryType: z.string().optional(),
  bodyPartAffected: z.string().optional(),
  witnessName: z.string().optional(),
  witnessContact: z.string().optional(),
  propertyDamage: z.boolean(),
  damageDescription: z.string().optional(),
  description: z.string().min(10),
  immediateAction: z.string().optional(),
});

export const updateIncidentSchema = createIncidentSchema.partial();
```

---

#### 3.3 Authentication Middleware Enhancement
**File:** `services/api/src/middlewares/auth.middleware.ts`

Verify it's correctly extracting user from JWT and attaching to request.

---

#### 3.4 File Upload Middleware (Optional for Phase 2)
**File:** `services/api/src/middlewares/upload.middleware.ts`

Configure Multer for file attachments (images, documents):

```typescript
import multer from 'multer';
import path from 'path';
import { AppError } from './error.middleware';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and PDF allowed', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});
```

---

### 4. Verify Existing Middleware (Estimated: 0.5 days)

Check that these files are correctly implemented:

1. **Error Handler** - `middlewares/error.middleware.ts`
2. **Rate Limiter** - `middlewares/rateLimiter.middleware.ts`
3. **Audit Logger** - `middlewares/audit.middleware.ts`
4. **Logger** - `utils/logger.ts`

---

### 5. Database Setup for Local Development (Estimated: 0.5 days)

#### 5.1 Create .env file
```bash
cp services/api/.env.example services/api/.env
```

Edit with local PostgreSQL credentials.

#### 5.2 Start PostgreSQL
```bash
docker-compose up -d postgres
```

#### 5.3 Run migrations
```bash
pnpm db:migrate
```

#### 5.4 Create seed file (Optional but recommended)
**File:** `services/api/prisma/seed.ts`

Seed:
- Default roles (Safety Head, ASM, etc.)
- Sample departments
- Test users
- Sample incidents for testing

```bash
pnpm db:seed
```

---

### 6. Testing Strategy (Estimated: 3-4 days)

#### 6.1 Setup Jest
Add Jest configuration if not already present.

#### 6.2 Unit Tests
Create tests for each service:

```
services/api/src/services/__tests__/auth.service.test.ts
services/api/src/services/__tests__/incident.service.test.ts
services/api/src/services/__tests__/investigation.service.test.ts
services/api/src/services/__tests__/hazard.service.test.ts
// ... etc
```

**Test Coverage Target:** 80%

#### 6.3 Integration Tests
Test API endpoints with Supertest:

```
services/api/src/__tests__/integration/auth.test.ts
services/api/src/__tests__/integration/incidents.test.ts
// ... etc
```

---

## Phase 3 Timeline & Deliverables

| Task | Estimated Time | Priority | Deliverable |
|------|----------------|----------|-------------|
| Audit Service | 1.5 days | P0 | Functional service with tests |
| Training Service | 1.5 days | P0 | Functional service with tests |
| PPE Service | 1 day | P0 | Functional service with tests |
| Mock Drill Service | 0.5 days | P0 | Functional service with tests |
| Report Service | 1.5 days | P0 | Functional service with tests |
| Notification Service | 0.5 days | P1 | Functional service |
| User Service | 0.5 days | P1 | Functional service |
| **Service Layer Total** | **7 days** | | |
| | | | |
| Controller Implementation | 3-4 days | P0 | All controllers functional |
| Authorization Middleware | 1 day | P0 | RBAC implemented |
| Validation Schemas | 1 day | P0 | All inputs validated |
| Middleware Verification | 0.5 days | P1 | All middleware tested |
| **Middleware Total** | **2.5 days** | | |
| | | | |
| Database Setup & Seeding | 0.5 days | P1 | Local dev ready |
| Unit Tests | 2 days | P1 | 80% coverage |
| Integration Tests | 2 days | P2 | Key endpoints tested |
| **Testing Total** | **4.5 days** | | |
| | | | |
| **GRAND TOTAL** | **17-18 days** | | **Production-ready API** |

---

## Success Criteria

Before considering the backend API complete, verify:

- [x] All services implemented and tested
- [x] All controllers implemented with validation
- [x] Authorization middleware working correctly
- [x] All TypeScript builds without errors
- [x] 80%+ test coverage
- [x] All API endpoints documented
- [x] Local development environment working
- [x] Database migrations tested
- [x] Seed data functional
- [x] Error handling comprehensive
- [x] Security audit passed (SQL injection, XSS, CSRF)
- [x] Rate limiting verified
- [x] CORS configured properly

---

## Documentation Deliverables

### 1. API Documentation
**File:** `docs/API.md`

Complete API reference with:
- All endpoints
- Request/response examples
- Error codes
- Authentication guide
- Rate limiting info

### 2. Development Guide
**File:** `docs/DEVELOPMENT.md`

- Local setup steps
- Running the API
- Running tests
- Code style guidelines
- Contributing guide

### 3. Deployment Guide
**File:** `docs/DEPLOYMENT.md`

- Docker deployment
- Kubernetes deployment
- Environment variables
- Database migration strategy
- Monitoring setup

---

## Beyond Backend API (Future Phases)

After completing the backend API, the project will need:

1. **Frontend Web Application** (React + TypeScript)
   - User interfaces for all modules
   - Dashboards and reports
   - Admin panels

2. **Mobile Application** (React Native)
   - Offline-first architecture
   - Camera integration
   - GPS tracking

3. **Production Infrastructure**
   - CI/CD pipelines
   - Kubernetes deployment
   - Monitoring (Prometheus, Grafana)
   - Error tracking (Sentry)
   - Logging (ELK stack)

4. **Advanced Features**
   - Real-time notifications (WebSockets)
   - Email notifications
   - File storage (S3/Azure Blob)
   - Data export (Excel, PDF)
   - AI-powered insights
   - Predictive analytics

---

## How to Get Started

1. **Review this document** and the `DEVELOPMENT_ROADMAP.md`
2. **Choose a service to implement** (recommended order: Audit → Training → PPE)
3. **Follow the service template** from Investigation or Hazard services
4. **Write tests** as you implement
5. **Update controllers** after service is complete
6. **Test endpoints** manually with Postman/Insomnia
7. **Document** as you go
8. **Commit frequently** with clear messages

---

## Questions or Issues?

- Review the Prisma schema for data model reference
- Check existing services (Auth, Incident, Investigation, Hazard) for patterns
- Refer to the DEVELOPMENT_ROADMAP.md for detailed requirements
- Test locally using Docker Compose and Postman

---

**Last Updated:** 2025-10-27  
**Progress:** Phase 1 Complete ✅ | Phase 2: 36% Complete 🔄  
**Next Milestone:** Complete all 7 remaining services
