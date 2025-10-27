# BFCL Safety Management System - Development Roadmap

## Overview
This document outlines the development roadmap for completing the BFCL Safety Management System backend API and preparing it for production deployment.

## Current Status (Phase 1 - Complete ✅)

### Infrastructure ✅
- [x] Monorepo structure with pnpm workspaces
- [x] TypeScript configuration
- [x] ESLint and Prettier setup
- [x] Docker Compose configuration
- [x] PostgreSQL database schema

### Database Layer ✅
- [x] Prisma schema with all entities defined
  - Users, Roles, Departments
  - Incidents, Investigations, Corrective Actions
  - Hazards, Audits, Training Programs
  - PPE Management, Mock Drills
  - Notifications, Audit Logs
- [x] Initial migration created
- [x] Prisma Client generated

### API Foundation ✅
- [x] Express server setup with TypeScript
- [x] Route structure for all modules
- [x] Middleware framework
  - Rate limiting
  - CORS
  - Helmet security
  - Error handling
  - Audit logging

### Completed Services ✅
- [x] Authentication Service (register, login, refresh token, change password)
- [x] Incident Service (CRUD operations, submit workflow)

---

## Phase 2 - Service Layer Implementation 🔄

### Priority 1: Core Safety Modules

#### 2.1 Investigation Service
**File:** `services/api/src/services/investigation.service.ts`

**Requirements:**
- Create investigation from incident
- Auto-assign investigator based on severity
- Support co-investigators for HIGH/CRITICAL incidents
- Root cause analysis (RCA) tracking
- 5-Whys methodology support
- CAPA generation and linking
- Status workflow: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → CLOSED
- Approval workflow

**API Endpoints:**
```
POST   /api/v1/investigations
GET    /api/v1/investigations
GET    /api/v1/investigations/:id
PUT    /api/v1/investigations/:id
POST   /api/v1/investigations/:id/submit
POST   /api/v1/investigations/:id/approve
DELETE /api/v1/investigations/:id
```

**Business Rules:**
- HIGH severity: Requires Senior Safety Officer + 1 co-investigator
- CRITICAL severity: Requires ASM + Safety Head + 2 co-investigators
- Investigation must be completed within 7 days for HIGH, 3 days for CRITICAL
- Minimum 1 CAPA required for HIGH/CRITICAL incidents

---

#### 2.2 Hazard Service
**File:** `services/api/src/services/hazard.service.ts`

**Requirements:**
- Create hazard reports with risk assessment
- Risk matrix calculation (Likelihood × Consequence = Risk Score)
- Hazard register management
- Control measures tracking
- Status workflow: OPEN → UNDER_REVIEW → CONTROLS_IMPLEMENTED → CLOSED
- Link to corrective actions
- Filtering by category, risk level, status, department

**API Endpoints:**
```
POST   /api/v1/hazards
GET    /api/v1/hazards
GET    /api/v1/hazards/:id
PUT    /api/v1/hazards/:id
POST   /api/v1/hazards/:id/close
GET    /api/v1/hazards/register
```

**Risk Matrix:**
```
Likelihood (1-5) × Consequence (1-5) = Risk Score (1-25)

Risk Levels:
- LOW: 1-5
- MEDIUM: 6-10
- HIGH: 11-15
- EXTREME: 16-25
```

---

#### 2.3 Audit Service
**File:** `services/api/src/services/audit.service.ts`

**Requirements:**
- Schedule audits with checklist
- Conduct audits with checkpoint evaluation
- Support multiple audit types (PPE, 5S, Fire Safety, etc.)
- Generate NCRs (Non-Conformance Reports)
- Calculate compliance scores
- Link to corrective actions
- Status workflow: SCHEDULED → IN_PROGRESS → COMPLETED → UNDER_REVIEW → CLOSED

**API Endpoints:**
```
POST   /api/v1/audits
GET    /api/v1/audits
GET    /api/v1/audits/:id
PUT    /api/v1/audits/:id
POST   /api/v1/audits/:id/complete
GET    /api/v1/audits/:id/checkpoints
POST   /api/v1/audits/:id/checkpoints
PUT    /api/v1/audits/:id/checkpoints/:checkpointId
```

**Compliance Score Calculation:**
```
Score = (Compliant Items / Total Items) × 100
Passing Score: 85%
```

---

### Priority 2: Training & PPE Management

#### 2.4 Training Service
**File:** `services/api/src/services/training.service.ts`

**Requirements:**
- Training program management
- Session scheduling
- Attendance tracking
- Quiz/assessment management
- Certificate generation
- Expiry tracking and notifications (30 days prior)
- Mandatory training enforcement

**API Endpoints:**
```
POST   /api/v1/training/programs
GET    /api/v1/training/programs
GET    /api/v1/training/programs/:id
PUT    /api/v1/training/programs/:id
DELETE /api/v1/training/programs/:id

POST   /api/v1/training/sessions
GET    /api/v1/training/sessions
GET    /api/v1/training/sessions/:id
PUT    /api/v1/training/sessions/:id
POST   /api/v1/training/sessions/:id/complete

POST   /api/v1/training/sessions/:id/attendance
PUT    /api/v1/training/sessions/:id/attendance/:userId

GET    /api/v1/training/certifications/user/:userId
GET    /api/v1/training/certifications/expiring
```

---

#### 2.5 PPE Service
**File:** `services/api/src/services/ppe.service.ts`

**Requirements:**
- PPE inventory management
- Issuance tracking
- Return processing
- Stock alerts (reorder level)
- Analyzer calibration tracking
- Expiry management

**API Endpoints:**
```
POST   /api/v1/ppe/items
GET    /api/v1/ppe/items
GET    /api/v1/ppe/items/:id
PUT    /api/v1/ppe/items/:id
DELETE /api/v1/ppe/items/:id

POST   /api/v1/ppe/issuances
GET    /api/v1/ppe/issuances
GET    /api/v1/ppe/issuances/:id
POST   /api/v1/ppe/issuances/:id/return

GET    /api/v1/ppe/inventory/low-stock
GET    /api/v1/ppe/issuances/user/:userId

POST   /api/v1/ppe/calibrations
GET    /api/v1/ppe/calibrations
GET    /api/v1/ppe/calibrations/:id
PUT    /api/v1/ppe/calibrations/:id
```

---

### Priority 3: Support Services

#### 2.6 Mock Drill Service
**File:** `services/api/src/services/mockDrill.service.ts`

**Requirements:**
- Schedule emergency drills
- Participant management
- Performance tracking
- Observation recording
- Gap analysis
- Drill types: Fire, Earthquake, Chemical Spill, Medical Emergency, Evacuation, Lockdown

**API Endpoints:**
```
POST   /api/v1/mock-drills
GET    /api/v1/mock-drills
GET    /api/v1/mock-drills/:id
PUT    /api/v1/mock-drills/:id
POST   /api/v1/mock-drills/:id/complete
POST   /api/v1/mock-drills/:id/participants
PUT    /api/v1/mock-drills/:id/participants/:userId
```

---

#### 2.7 Report Service
**File:** `services/api/src/services/report.service.ts`

**Requirements:**
- Dashboard statistics (incident trends, KPIs)
- OSHA 300/301 log generation
- Incident reports (by type, severity, department)
- CAPA aging reports
- Training completion reports
- Compliance reports
- KPI calculations: LTIFR, TRIR

**API Endpoints:**
```
GET    /api/v1/reports/dashboard
GET    /api/v1/reports/incidents
GET    /api/v1/reports/osha-log
GET    /api/v1/reports/kpi
GET    /api/v1/reports/capa-aging
GET    /api/v1/reports/training-completion
GET    /api/v1/reports/compliance
```

**KPI Formulas:**
```
LTIFR = (Lost Time Injuries × 1,000,000) / Total Hours Worked
TRIR = (Total Recordable Incidents × 200,000) / Total Hours Worked
```

---

#### 2.8 Notification Service
**File:** `services/api/src/services/notification.service.ts`

**Requirements:**
- Create notifications for various events
- Mark as read
- Filter by type and status
- Notification types:
  - Incident assigned
  - Investigation required
  - CAPA assigned/overdue
  - Training scheduled
  - Certification expiring
  - Audit scheduled
  - Drill scheduled
  - Approval required

**API Endpoints:**
```
GET    /api/v1/notifications
GET    /api/v1/notifications/:id
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id
```

---

#### 2.9 User Service
**File:** `services/api/src/services/user.service.ts`

**Requirements:**
- User management (CRUD)
- Role assignment
- Department assignment
- Profile management
- Active/inactive status
- User search and filtering

**API Endpoints:**
```
POST   /api/v1/users
GET    /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
PUT    /api/v1/users/:id/deactivate
PUT    /api/v1/users/:id/activate
```

---

## Phase 3 - Controller Implementation 🔄

For each service implemented in Phase 2, implement the corresponding controller with:
- Request validation (Zod schemas)
- Error handling
- Response formatting
- Pagination support
- Filtering and sorting

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

---

## Phase 4 - Middleware & Security 🔐

### 4.1 Authentication Middleware ✅
**File:** `services/api/src/middlewares/auth.middleware.ts`
- JWT token verification
- User extraction from token
- Error handling for invalid/expired tokens

### 4.2 Authorization Middleware
**File:** `services/api/src/middlewares/authorization.middleware.ts`
- Role-based access control (RBAC)
- Permission checking
- Resource-level authorization

**Role Hierarchy:**
```
Level 5: Safety Head (Full access)
Level 4: ASM (High access)
Level 3: Senior Safety Officer (Medium access)
Level 2: Safety Officer (Operational access)
Level 1: Assistant Safety Officer (Field access)
Level 0: Worker/Contractor (Limited access)
```

### 4.3 Validation Middleware
**Files:** `services/api/src/middlewares/validation/`
- Zod schemas for all request bodies
- Query parameter validation
- File upload validation

### 4.4 Error Handling ✅
**File:** `services/api/src/middlewares/error.middleware.ts`
- Centralized error handling
- Standard error responses
- Error logging

### 4.5 Audit Logging ✅
**File:** `services/api/src/middlewares/audit.middleware.ts`
- Log all critical actions
- Track user, timestamp, IP, changes
- Store in AuditLog table

---

## Phase 5 - Testing 🧪

### 5.1 Unit Tests
- Service layer tests
- Middleware tests
- Utility function tests

### 5.2 Integration Tests
- API endpoint tests
- Database transaction tests
- Authentication flow tests

### 5.3 Test Coverage Target
- Minimum 80% code coverage
- All critical paths tested

---

## Phase 6 - Documentation 📚

### 6.1 API Documentation
**File:** `docs/API.md`
- Complete endpoint reference
- Request/response examples
- Error codes
- Authentication guide

### 6.2 Development Guide
**File:** `docs/DEVELOPMENT.md`
- Local setup instructions
- Database seeding
- Running tests
- Code style guidelines

### 6.3 Deployment Guide
**File:** `docs/DEPLOYMENT.md`
- Docker deployment
- Kubernetes deployment
- Environment configuration
- Database migration strategy

### 6.4 User Guide
**File:** `docs/USER_GUIDE.md`
- Feature overview
- User workflows
- Screenshots

### 6.5 Admin Guide
**File:** `docs/ADMIN_GUIDE.md`
- System configuration
- User management
- Backup/restore procedures
- Monitoring and troubleshooting

---

## Phase 7 - Production Readiness ✈️

### 7.1 Database
- [ ] Review and optimize indexes
- [ ] Add database constraints
- [ ] Setup backup strategy
- [ ] Migration rollback procedures

### 7.2 Security
- [ ] Security audit
- [ ] Rate limiting verification
- [ ] SQL injection testing
- [ ] XSS prevention
- [ ] CORS configuration review
- [ ] SSL/TLS certificate setup

### 7.3 Performance
- [ ] Load testing
- [ ] Database query optimization
- [ ] Caching strategy (Redis)
- [ ] File upload optimization

### 7.4 Monitoring
- [ ] Application logging (Winston)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic/DataDog)
- [ ] Health check endpoints

### 7.5 CI/CD
- [ ] GitHub Actions workflows
- [ ] Automated testing
- [ ] Docker image building
- [ ] Deployment automation

---

## Timeline Estimation

| Phase | Estimated Duration | Priority |
|-------|-------------------|----------|
| Phase 1: Foundation | ✅ Complete | P0 |
| Phase 2: Service Layer | 5-7 days | P0 |
| Phase 3: Controllers | 3-4 days | P0 |
| Phase 4: Middleware | 2-3 days | P1 |
| Phase 5: Testing | 3-4 days | P1 |
| Phase 6: Documentation | 2-3 days | P2 |
| Phase 7: Production Readiness | 3-5 days | P1 |

**Total Estimated Duration:** 18-26 days

---

## Success Criteria

- [x] All TypeScript builds without errors
- [ ] All services implemented and tested
- [ ] All API endpoints functional
- [ ] 80%+ test coverage
- [ ] Complete API documentation
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Production deployment successful

---

## Next Immediate Steps

1. **Implement Investigation Service** - Highest priority as it's core to incident workflow
2. **Implement Hazard Service** - Critical for HIRA functionality
3. **Implement CAPA/Corrective Action logic** - Shared across multiple modules
4. **Implement Authorization Middleware** - Required for RBAC
5. **Create Validation Schemas** - Required for all endpoints

---

## Technical Debt & Future Enhancements

### Short-term
- Add request validation middleware
- Implement comprehensive error handling
- Add API versioning
- Setup Swagger/OpenAPI documentation

### Medium-term
- Implement file upload service (S3/Azure Blob)
- Add email notification service
- Implement real-time notifications (WebSockets)
- Add data export functionality (Excel, PDF)

### Long-term
- AI-powered incident analysis
- Predictive risk analytics
- Voice-based incident reporting
- Mobile app (React Native)
- Advanced reporting dashboard (React)
- Integration with IoT sensors
- Machine learning for trend analysis

---

**Last Updated:** 2025-10-27
**Document Owner:** Development Team
