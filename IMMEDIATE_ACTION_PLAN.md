# BFCL Safety Management System - Immediate Action Plan

**Priority**: HIGH  
**Target Completion**: Next 2-4 Weeks  
**Status**: 🟡 In Progress

---

## 🎯 Overview

This document outlines the **immediate action items** to advance the BFCL Safety Management System from its current state to a fully functional backend with complete service implementations.

### Current Status
✅ **Completed**:
- Project structure and monorepo setup
- Database schema (23+ entities)
- Prisma ORM with migrations
- Authentication system (JWT-based)
- 2 complete services (Auth, Incident)
- Docker development environment

⚠️ **Blockers**:
- TypeScript build errors (must fix first)
- 9 services not yet implemented
- No testing infrastructure

---

## 🚨 CRITICAL: Week 1 - Fix Build Issues & Core Services

### Day 1: Fix Build Errors (MUST DO FIRST)

#### Issue 1: auth.controller.ts Type Mismatch
**File**: `services/api/src/controllers/auth.controller.ts`  
**Line**: ~35

**Problem**: Zod validation returns optional fields, but RegisterData expects required fields.

**Solution**:
```typescript
// Option 1: Update Zod schema to ensure required fields
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  employeeId: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
});

// Option 2: Type assertion after validation
const validatedData = registerSchema.parse(req.body);
const result = await authService.register(validatedData as RegisterData);
```

---

#### Issue 2: incident.controller.ts Type Mismatch
**File**: `services/api/src/controllers/incident.controller.ts`  
**Line**: ~32

**Problem**: Similar to auth controller - optional vs required fields.

**Solution**:
```typescript
// Ensure Zod schema marks required fields correctly
const createIncidentSchema = z.object({
  departmentId: z.string(),
  incidentDate: z.string().datetime(), // or z.date()
  incidentTime: z.string(),
  location: z.string(),
  // ... other fields
});
```

---

#### Issue 3: auth.service.ts JWT Type Issues
**File**: `services/api/src/services/auth.service.ts`  
**Lines**: 188, 194

**Problem**: jwt.sign() type mismatch with expiresIn option.

**Solution**:
```typescript
// Fix JWT token generation
const accessToken = jwt.sign(
  payload,
  process.env.JWT_SECRET as string,
  { expiresIn: '15m' } // Use string format, not process.env
);

const refreshToken = jwt.sign(
  payload,
  process.env.JWT_SECRET as string,
  { expiresIn: '7d' } // Use string format
);
```

---

### Day 2-3: Investigation Service Implementation

**Priority**: CRITICAL (blocks incident workflow completion)

**Files to Create**:
1. `services/api/src/services/investigation.service.ts`
2. Update `services/api/src/controllers/investigation.controller.ts`
3. Update `services/api/src/routes/investigation.routes.ts`

**Key Methods**:
```typescript
class InvestigationService {
  async createInvestigation(incidentId: string, data: CreateInvestigationData)
  async assignInvestigators(id: string, investigators: string[])
  async conductRCA(id: string, rcaData: RootCauseAnalysisData)
  async conduct5Whys(id: string, whysData: FiveWhysData)
  async generateCAPA(id: string, capaData: CAPAData)
  async submitForApproval(id: string)
  async approveInvestigation(id: string, approverRole: string)
  async getInvestigation(id: string)
  async listInvestigations(filters: InvestigationFilters)
}
```

**Business Logic**:
- Auto-assign investigators based on severity:
  - MEDIUM: Department Head as co-investigator
  - HIGH/CRITICAL: BU Head + Safety Head required
- Target completion: 7 days for HIGH/CRITICAL
- Send notifications to assigned team
- Track CAPA generation and ownership
- Multi-level approval workflow

**Testing Checklist**:
- [ ] Create investigation from incident
- [ ] Assign investigators (single & multiple)
- [ ] Add RCA findings
- [ ] Complete 5-Whys analysis
- [ ] Generate CAPA items
- [ ] Submit for approval
- [ ] Approve investigation (multi-level)
- [ ] List investigations with filters

---

### Day 4-5: Hazard Service Implementation

**Priority**: HIGH (core safety feature)

**Files to Create**:
1. `services/api/src/services/hazard.service.ts`
2. Update `services/api/src/controllers/hazard.controller.ts`
3. Update `services/api/src/routes/hazard.routes.ts`

**Key Methods**:
```typescript
class HazardService {
  async createHazard(data: CreateHazardData)
  async assessRisk(id: string, riskData: RiskAssessmentData)
  async addControlMeasures(id: string, measures: ControlMeasure[])
  async updateHazardStatus(id: string, status: HazardStatus)
  async getHazardRegister(filters: HazardFilters)
  async getHazard(id: string)
  async generateRiskMatrix()
}
```

**Risk Assessment Algorithm**:
```typescript
function calculateRiskScore(likelihood: number, consequence: number): {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
} {
  const score = likelihood * consequence;
  
  if (score <= 8) return { score, level: 'LOW' };
  if (score <= 12) return { score, level: 'MEDIUM' };
  if (score <= 20) return { score, level: 'HIGH' };
  return { score, level: 'CRITICAL' };
}
```

**Testing Checklist**:
- [ ] Report new hazard
- [ ] Perform risk assessment (all combinations)
- [ ] Add control measures (hierarchy of controls)
- [ ] Update hazard status
- [ ] Retrieve hazard register with filters
- [ ] Generate risk matrix

---

### Day 6-7: Audit Service Implementation

**Priority**: HIGH (compliance requirement)

**Files to Create**:
1. `services/api/src/services/audit.service.ts`
2. Update `services/api/src/controllers/audit.controller.ts`
3. Update `services/api/src/routes/audit.routes.ts`

**Key Methods**:
```typescript
class AuditService {
  async scheduleAudit(data: ScheduleAuditData)
  async conductAudit(id: string, items: AuditItem[])
  async generateNCR(auditId: string, nonConformances: NCRData[])
  async completeAudit(id: string)
  async getAuditHistory(filters: AuditFilters)
  async getComplianceScore(departmentId?: string)
}
```

**Compliance Score Calculation**:
```typescript
function calculateComplianceScore(auditItems: AuditItem[]): number {
  const compliantItems = auditItems.filter(item => item.isCompliant).length;
  return (compliantItems / auditItems.length) * 100;
}
```

**Testing Checklist**:
- [ ] Schedule audit (all types)
- [ ] Conduct audit with checklist
- [ ] Generate NCR from findings
- [ ] Complete audit
- [ ] List audit history
- [ ] Calculate compliance score

---

## 📅 Week 2 - Training & Supporting Services

### Day 8-10: Training Service

**Files to Create**:
1. `services/api/src/services/training.service.ts`
2. Update `services/api/src/controllers/training.controller.ts`
3. Update `services/api/src/routes/training.routes.ts`

**Key Methods**:
```typescript
class TrainingService {
  async createProgram(data: CreateProgramData)
  async scheduleSession(data: ScheduleSessionData)
  async recordAttendance(sessionId: string, attendees: AttendanceData[])
  async issueCertificate(data: CertificateData)
  async getCertificationStatus(userId: string)
  async sendExpiryAlerts()
  async getTrainingMetrics(filters: TrainingFilters)
}
```

**Expiry Alert Logic**:
```typescript
async function sendExpiryAlerts() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const expiringCerts = await prisma.certification.findMany({
    where: {
      expiryDate: {
        lte: thirtyDaysFromNow,
        gte: now
      },
      status: 'ACTIVE'
    },
    include: { user: true, program: true }
  });
  
  // Send notifications for each expiring certification
  for (const cert of expiringCerts) {
    await notificationService.create({
      userId: cert.userId,
      type: 'TRAINING_EXPIRY',
      title: 'Certification Expiring Soon',
      message: `Your ${cert.program.name} certification expires on ${cert.expiryDate}`
    });
  }
}
```

---

### Day 11-12: PPE & Mock Drill Services

#### PPE Service
**Files to Create**:
1. `services/api/src/services/ppe.service.ts`
2. Update `services/api/src/controllers/ppe.controller.ts`
3. Update `services/api/src/routes/ppe.routes.ts`

**Key Features**:
- Inventory management
- Stock alerts (when quantity <= reorderLevel)
- Issuance tracking
- Return management
- Calibration records

---

#### Mock Drill Service
**Files to Create**:
1. `services/api/src/services/mockDrill.service.ts`
2. Update `services/api/src/controllers/mockDrill.controller.ts`
3. Update `services/api/src/routes/mockDrill.routes.ts`

**Key Features**:
- Schedule drills
- Track participants
- Record observations
- Gap analysis
- Effectiveness rating

---

### Day 13-14: Report, Notification & User Services

#### Report Service
**Key Methods**:
```typescript
class ReportService {
  async getDashboardStats()
  async getKPIMetrics(startDate: Date, endDate: Date)
  async getOSHA300Log(year: number)
  async getOSHA301Report(incidentId: string)
  async getTrendAnalysis(metric: string, period: string)
  async getCAPAAgeingReport()
  async getDepartmentReport(departmentId: string)
}
```

**KPI Calculations**:
```typescript
// LTIFR = (Lost Time Injuries × 1,000,000) / Total Hours Worked
function calculateLTIFR(lostTimeInjuries: number, totalHoursWorked: number): number {
  return (lostTimeInjuries * 1000000) / totalHoursWorked;
}

// TRIR = (Total Recordable Incidents × 200,000) / Total Hours Worked
function calculateTRIR(totalIncidents: number, totalHoursWorked: number): number {
  return (totalIncidents * 200000) / totalHoursWorked;
}
```

---

#### Notification Service
**Key Features**:
- Create notifications (single & batch)
- Mark as read/unread
- Delete notifications
- Notification preferences
- Email integration (future)

---

#### User Management Service
**Key Features**:
- CRUD operations
- Role assignment
- Department transfer
- Bulk import (CSV)
- Password reset

---

## ✅ Week-by-Week Success Criteria

### Week 1 Success Criteria
- [ ] Zero TypeScript compilation errors
- [ ] All lint issues resolved
- [ ] Investigation service complete with tests
- [ ] Hazard service complete with tests
- [ ] Audit service complete with tests
- [ ] API documentation updated

### Week 2 Success Criteria
- [ ] Training service complete with tests
- [ ] PPE service complete with tests
- [ ] Mock Drill service complete with tests
- [ ] Report service complete with tests
- [ ] Notification service complete
- [ ] User management service complete
- [ ] All 50+ API endpoints functional
- [ ] Postman collection updated
- [ ] Progress report updated

---

## 🧪 Testing Strategy (Apply to Each Service)

### 1. Unit Tests (Jest)
```typescript
describe('InvestigationService', () => {
  describe('createInvestigation', () => {
    it('should create investigation for incident', async () => {
      // Test implementation
    });
    
    it('should auto-assign investigators based on severity', async () => {
      // Test implementation
    });
    
    it('should send notifications to assigned team', async () => {
      // Test implementation
    });
  });
  
  // More test suites...
});
```

### 2. Integration Tests (Supertest)
```typescript
describe('POST /api/v1/investigations', () => {
  it('should create investigation with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/investigations')
      .set('Authorization', `Bearer ${token}`)
      .send(validData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
  
  it('should return 401 without auth token', async () => {
    // Test implementation
  });
  
  // More tests...
});
```

### 3. Manual Testing (Postman)
- Create Postman collection for each service
- Test all endpoints with various scenarios
- Export collection for team use

---

## 📊 Progress Tracking

### Daily Checklist Template
```markdown
## Day X Progress

### Completed
- [ ] Task 1
- [ ] Task 2

### In Progress
- [ ] Task 3

### Blockers
- Issue description and resolution plan

### Tomorrow's Plan
- [ ] Next task
```

### Weekly Review Template
```markdown
## Week X Review

### Achievements
- Service A completed
- X tests written
- Y API endpoints functional

### Metrics
- Code coverage: X%
- Build status: Passing/Failing
- Open issues: X

### Next Week Goals
- Complete Service B
- Increase coverage to Y%
```

---

## 🚀 Quick Start Commands

### Daily Workflow
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install/update dependencies
pnpm install

# 3. Generate Prisma client (if schema changed)
pnpm db:generate

# 4. Run migrations (if new migrations)
pnpm db:migrate

# 5. Start development server
pnpm api:dev

# 6. Run tests (in another terminal)
pnpm test

# 7. Lint code
pnpm lint

# 8. Build to check for errors
pnpm build
```

### When Creating New Service
```bash
# 1. Create service file
touch services/api/src/services/newService.service.ts

# 2. Update controller
# Edit services/api/src/controllers/newService.controller.ts

# 3. Update routes
# Edit services/api/src/routes/newService.routes.ts

# 4. Register routes in main app
# Edit services/api/src/index.ts

# 5. Create tests
touch services/api/src/__tests__/unit/services/newService.service.test.ts
touch services/api/src/__tests__/integration/newService.routes.test.ts

# 6. Test
pnpm test

# 7. Document
# Update API_DOCUMENTATION.md
```

---

## 🎯 Sprint Goals

### Sprint 1 (Week 1)
**Goal**: Fix build errors and implement core investigation/hazard/audit services

**Tasks**:
1. Fix TypeScript errors
2. Investigation service + tests
3. Hazard service + tests
4. Audit service + tests

**Definition of Done**:
- All tests passing
- Code coverage ≥ 80%
- API documentation updated
- Code reviewed

---

### Sprint 2 (Week 2)
**Goal**: Complete remaining services and supporting features

**Tasks**:
1. Training service + tests
2. PPE service + tests
3. Mock Drill service + tests
4. Report service + tests
5. Notification service
6. User management service

**Definition of Done**:
- All services implemented
- All tests passing
- Postman collection complete
- Progress report updated

---

## 📞 Support & Resources

### Getting Help
- **Technical Issues**: Post in #engineering Slack channel
- **Design Questions**: Tag @technical-lead
- **Blockers**: Escalate to sprint lead

### Reference Documentation
- **Database Schema**: `services/api/prisma/schema.prisma`
- **API Docs**: `API_DOCUMENTATION.md`
- **Architecture**: `TECHNICAL_SPECIFICATIONS.md`
- **Progress**: `PROGRESS_REPORT.md`

### Code Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] All functions have type annotations
- [ ] Error handling implemented
- [ ] Input validation with Zod
- [ ] Tests written and passing
- [ ] No console.logs (use logger)
- [ ] API documented
- [ ] No hardcoded values
- [ ] Environment variables used correctly

---

## 🎉 Motivation

**Remember**: Each service you complete brings us closer to a production-ready system that will:
- Improve workplace safety
- Reduce incidents and injuries
- Ensure compliance with OSHA/ISO standards
- Save lives

**You're building something that matters!** 💪

---

**Document Owner**: Development Team  
**Last Updated**: October 27, 2025  
**Review Frequency**: Daily during sprints

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│         BFCL Safety System                  │
│         Immediate Action Card               │
├─────────────────────────────────────────────┤
│ TODAY:                                      │
│ 1. Fix TypeScript build errors             │
│ 2. Run: pnpm build (must pass)             │
│ 3. Run: pnpm lint (must pass)              │
│                                             │
│ THIS WEEK:                                  │
│ 1. Investigation Service                   │
│ 2. Hazard Service                           │
│ 3. Audit Service                            │
│                                             │
│ NEXT WEEK:                                  │
│ 1. Training Service                         │
│ 2. PPE Service                              │
│ 3. Mock Drill Service                       │
│ 4. Report Service                           │
│                                             │
│ SUCCESS METRICS:                            │
│ ✅ Build passes                             │
│ ✅ All tests pass                           │
│ ✅ Coverage ≥ 80%                           │
│ ✅ API docs updated                         │
└─────────────────────────────────────────────┘
```
