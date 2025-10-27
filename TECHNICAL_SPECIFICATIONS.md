# BFCL Safety Management System - Technical Specifications

**Version**: 1.0  
**Last Updated**: October 27, 2025  
**Status**: Living Document

---

## 📐 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native)  │  API Docs │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Gateway   │
                    │  (Rate Limit)   │
                    └───────┬────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Middleware  │  Validators     │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM  │  PostgreSQL  │  Redis Cache  │  File Storage│
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Docker  │  Kubernetes  │  Monitoring  │  Logging          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Entities

#### User Management
```prisma
model User {
  id            String       @id @default(cuid())
  username      String       @unique
  email         String       @unique
  password      String       // bcrypt hashed
  firstName     String?
  lastName      String?
  phoneNumber   String?
  employeeId    String?      @unique
  roleId        String
  role          Role         @relation(fields: [roleId], references: [id])
  departmentId  String?
  department    Department?  @relation(fields: [departmentId], references: [id])
  isActive      Boolean      @default(true)
  lastLogin     DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  level       Int      // Hierarchy level
  permissions Json     // Dynamic permissions
}

model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  headId      String?
  head        User?    @relation("DepartmentHead", fields: [headId])
}
```

#### Incident Management
```prisma
model Incident {
  id                    String          @id @default(cuid())
  incidentNumber        String          @unique
  reportedById          String
  reportedBy            User            @relation(fields: [reportedById])
  departmentId          String
  department            Department      @relation(fields: [departmentId])
  incidentDate          DateTime
  incidentTime          String
  location              String
  geoLocation           String?         // Lat,Long
  incidentType          IncidentType
  severity              Severity
  affectedPersonName    String?
  affectedPersonId      String?
  injuryType            String?
  bodyPartAffected      String?
  description           String          @db.Text
  rootCause             String?         @db.Text
  immediateAction       String?         @db.Text
  status                IncidentStatus  @default(DRAFT)
  requiresInvestigation Boolean         @default(false)
  submittedAt           DateTime?
  reviewedAt            DateTime?
  closedAt              DateTime?
  attachments           Attachment[]
  investigation         Investigation?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
}

enum IncidentType {
  INJURY
  ILLNESS
  NEAR_MISS
  PROPERTY_DAMAGE
  ENVIRONMENTAL
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum IncidentStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  UNDER_INVESTIGATION
  CLOSED
}
```

#### Investigation Management
```prisma
model Investigation {
  id                  String              @id @default(cuid())
  incidentId          String              @unique
  incident            Incident            @relation(fields: [incidentId])
  leadInvestigatorId  String
  leadInvestigator    User                @relation("LeadInvestigator", fields: [leadInvestigatorId])
  investigators       InvestigationTeam[]
  startDate           DateTime
  targetCompletionDate DateTime
  actualCompletionDate DateTime?
  findings            String?             @db.Text
  rootCauseAnalysis   Json?               // RCA data structure
  fiveWhys            Json?               // 5-Whys data
  correctiveActions   CorrectiveAction[]
  status              InvestigationStatus @default(PENDING)
  approvedBy          String?
  approvedAt          DateTime?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

model InvestigationTeam {
  investigationId String
  investigation   Investigation @relation(fields: [investigationId])
  userId          String
  user            User          @relation(fields: [userId])
  role            String        // INVESTIGATOR, CO_INVESTIGATOR, OBSERVER
  assignedAt      DateTime      @default(now())
  
  @@id([investigationId, userId])
}

enum InvestigationStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  APPROVED
}
```

#### CAPA (Corrective & Preventive Actions)
```prisma
model CorrectiveAction {
  id              String           @id @default(cuid())
  actionNumber    String           @unique
  title           String
  description     String           @db.Text
  type            CAPAType
  priority        Priority
  investigationId String?
  investigation   Investigation?   @relation(fields: [investigationId])
  auditId         String?
  audit           Audit?           @relation(fields: [auditId])
  ownerId         String
  owner           User             @relation("CAPAOwner", fields: [ownerId])
  dueDate         DateTime
  completedDate   DateTime?
  status          CAPAStatus       @default(OPEN)
  verifiedBy      String?
  verifiedAt      DateTime?
  effectiveness   String?          // Effectiveness review
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

enum CAPAType {
  CORRECTIVE
  PREVENTIVE
}

enum CAPAStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  VERIFIED
  CLOSED
  OVERDUE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

#### Hazard Identification (HIRA)
```prisma
model Hazard {
  id              String          @id @default(cuid())
  hazardNumber    String          @unique
  reportedById    String
  reportedBy      User            @relation(fields: [reportedById])
  departmentId    String
  department      Department      @relation(fields: [departmentId])
  location        String
  hazardCategory  HazardCategory
  description     String          @db.Text
  likelihood      Likelihood?
  consequence     Consequence?
  riskScore       Int?            // Calculated: likelihood × consequence
  riskLevel       RiskLevel?
  controlMeasures ControlMeasure[]
  status          HazardStatus    @default(IDENTIFIED)
  assessedBy      String?
  assessedAt      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum HazardCategory {
  MECHANICAL
  ELECTRICAL
  CHEMICAL
  BIOLOGICAL
  ERGONOMIC
  PHYSICAL
  ENVIRONMENTAL
  BEHAVIORAL
}

enum Likelihood {
  RARE            // 1
  UNLIKELY        // 2
  POSSIBLE        // 3
  LIKELY          // 4
  ALMOST_CERTAIN  // 5
}

enum Consequence {
  NEGLIGIBLE      // 1
  MINOR           // 2
  MODERATE        // 3
  MAJOR           // 4
  CATASTROPHIC    // 5
}

enum RiskLevel {
  LOW             // 1-8
  MEDIUM          // 9-12
  HIGH            // 15-20
  CRITICAL        // 25
}

enum HazardStatus {
  IDENTIFIED
  ASSESSED
  CONTROLLED
  CLOSED
}

model ControlMeasure {
  id          String         @id @default(cuid())
  hazardId    String
  hazard      Hazard         @relation(fields: [hazardId])
  measure     String         @db.Text
  hierarchy   ControlHierarchy
  responsible String?
  implementedAt DateTime?
  status      String         @default("PENDING")
}

enum ControlHierarchy {
  ELIMINATION
  SUBSTITUTION
  ENGINEERING_CONTROLS
  ADMINISTRATIVE_CONTROLS
  PPE
}
```

#### Audit & Compliance
```prisma
model Audit {
  id                String          @id @default(cuid())
  auditNumber       String          @unique
  auditType         AuditType
  scheduledDate     DateTime
  conductedDate     DateTime?
  auditorId         String
  auditor           User            @relation("Auditor", fields: [auditorId])
  departmentId      String?
  department        Department?     @relation(fields: [departmentId])
  location          String?
  checklistItems    AuditItem[]
  findings          String?         @db.Text
  nonConformances   CorrectiveAction[]
  complianceScore   Float?
  status            AuditStatus     @default(SCHEDULED)
  completedBy       String?
  completedAt       DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

enum AuditType {
  PPE_INSPECTION
  FIVE_S
  FIRE_SAFETY
  ELECTRICAL_SAFETY
  HOUSEKEEPING
  MACHINERY_SAFETY
  ENVIRONMENTAL_COMPLIANCE
  ERGONOMIC_ASSESSMENT
}

enum AuditStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  REVIEWED
}

model AuditItem {
  id            String   @id @default(cuid())
  auditId       String
  audit         Audit    @relation(fields: [auditId])
  checkPoint    String
  isCompliant   Boolean?
  observation   String?  @db.Text
  evidence      String?  // File URL
  remarks       String?
}
```

#### Training & Certification
```prisma
model TrainingProgram {
  id                  String            @id @default(cuid())
  name                String
  code                String            @unique
  description         String?           @db.Text
  trainingType        TrainingType
  duration            Int               // Hours
  validityPeriod      Int?              // Months
  isMandatory         Boolean           @default(false)
  targetRoles         String[]          // Array of role IDs
  sessions            TrainingSession[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}

enum TrainingType {
  INDUCTION
  REFRESHER
  SKILL_BASED
  COMPLIANCE
  EMERGENCY_RESPONSE
}

model TrainingSession {
  id              String             @id @default(cuid())
  programId       String
  program         TrainingProgram    @relation(fields: [programId])
  sessionDate     DateTime
  startTime       String
  endTime         String
  trainerId       String
  trainer         User               @relation("Trainer", fields: [trainerId])
  location        String?
  maxParticipants Int?
  attendees       TrainingAttendance[]
  status          SessionStatus      @default(SCHEDULED)
  completedAt     DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

enum SessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model TrainingAttendance {
  sessionId   String
  session     TrainingSession @relation(fields: [sessionId])
  userId      String
  user        User            @relation(fields: [userId])
  attended    Boolean         @default(false)
  score       Float?
  feedback    String?         @db.Text
  
  @@id([sessionId, userId])
}

model Certification {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId])
  programId       String
  program         TrainingProgram @relation(fields: [programId])
  certificateNumber String  @unique
  issueDate       DateTime
  expiryDate      DateTime?
  issuedBy        String
  status          CertificationStatus @default(ACTIVE)
  createdAt       DateTime  @default(now())
}

enum CertificationStatus {
  ACTIVE
  EXPIRED
  REVOKED
}
```

#### PPE Management
```prisma
model PPEItem {
  id              String       @id @default(cuid())
  name            String
  category        PPECategory
  code            String       @unique
  stockQuantity   Int
  reorderLevel    Int
  unitPrice       Float?
  supplier        String?
  issuances       PPEIssuance[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum PPECategory {
  HEAD_PROTECTION
  EYE_PROTECTION
  HEARING_PROTECTION
  RESPIRATORY_PROTECTION
  HAND_PROTECTION
  FOOT_PROTECTION
  BODY_PROTECTION
  FALL_PROTECTION
}

model PPEIssuance {
  id              String    @id @default(cuid())
  itemId          String
  item            PPEItem   @relation(fields: [itemId])
  userId          String
  user            User      @relation(fields: [userId])
  quantity        Int
  issuedDate      DateTime  @default(now())
  returnDate      DateTime?
  condition       String?   // At return
  issuedBy        String
  issuedByUser    User      @relation("PPEIssuer", fields: [issuedBy])
  remarks         String?
}
```

#### Mock Drills
```prisma
model MockDrill {
  id              String               @id @default(cuid())
  drillNumber     String               @unique
  drillType       DrillType
  scheduledDate   DateTime
  conductedDate   DateTime?
  location        String
  scenario        String               @db.Text
  conductedBy     String
  conductor       User                 @relation("DrillConductor", fields: [conductedBy])
  participants    MockDrillParticipant[]
  observations    String?              @db.Text
  gaps            String?              @db.Text
  recommendations String?              @db.Text
  effectiveness   Int?                 // 1-10 scale
  status          DrillStatus          @default(SCHEDULED)
  completedAt     DateTime?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}

enum DrillType {
  FIRE_DRILL
  EVACUATION
  FIRST_AID
  CHEMICAL_SPILL
  EARTHQUAKE
  LOCKDOWN
}

enum DrillStatus {
  SCHEDULED
  CONDUCTED
  REVIEWED
}

model MockDrillParticipant {
  drillId       String
  drill         MockDrill @relation(fields: [drillId])
  userId        String
  user          User      @relation(fields: [userId])
  attended      Boolean   @default(false)
  performance   String?   // EXCELLENT, GOOD, SATISFACTORY, NEEDS_IMPROVEMENT
  remarks       String?
  
  @@id([drillId, userId])
}
```

#### Notifications & Audit Logs
```prisma
model Notification {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId])
  type        NotificationType
  title       String
  message     String           @db.Text
  link        String?
  isRead      Boolean          @default(false)
  readAt      DateTime?
  createdAt   DateTime         @default(now())
}

enum NotificationType {
  INCIDENT_SUBMITTED
  INCIDENT_APPROVED
  INVESTIGATION_ASSIGNED
  CAPA_DUE
  CAPA_OVERDUE
  TRAINING_EXPIRY
  TRAINING_SCHEDULED
  AUDIT_SCHEDULED
  HAZARD_REPORTED
  DRILL_SCHEDULED
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId])
  action      String
  entity      String
  entityId    String
  changes     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
}
```

---

## 🔐 Security Specifications

### Authentication

#### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  roleLevel: number;
  departmentId?: string;
  iat: number;  // Issued at
  exp: number;  // Expiry
}
```

**Access Token**: Expires in 15 minutes  
**Refresh Token**: Expires in 7 days

#### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- bcrypt hash with 10 salt rounds

### Authorization (RBAC)

#### Permission Matrix

| Resource | Safety Head | ASM | Sr. Officer | Officer | Asst. Officer | Worker |
|----------|------------|-----|-------------|---------|---------------|--------|
| **Incidents** |
| View All | ✅ | ✅ | ✅ | ✅ | ✅ | Own only |
| Create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ✅ | ✅ | Own only | Own only | Own only |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Investigations** |
| View All | ✅ | ✅ | ✅ | Assigned | Assigned | ❌ |
| Conduct | ✅ | ✅ | ✅ | Assigned | ❌ | ❌ |
| Approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Hazards** |
| View All | ✅ | ✅ | ✅ | ✅ | ✅ | Own only |
| Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assess | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Audits** |
| Schedule | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Conduct | ✅ | ✅ | ✅ | Assigned | ❌ | ❌ |
| Approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Training** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Conduct | ✅ | ✅ | ✅ | Assigned | ❌ | ❌ |
| **Reports** |
| View All | ✅ | ✅ | Dept only | Dept only | Dept only | ❌ |
| Export | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Users** |
| View All | ✅ | ✅ | Dept only | ❌ | ❌ | ❌ |
| Manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Rate Limiting

```typescript
// Authentication endpoints
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: "Too many login attempts"
}

// General API endpoints
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests"
}

// File upload endpoints
{
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 50,                    // 50 uploads per hour
  message: "Upload limit exceeded"
}
```

### Data Encryption

- **In Transit**: TLS 1.3
- **At Rest**: AES-256
- **Passwords**: bcrypt (10 rounds)
- **Tokens**: HS256 (JWT)
- **Sensitive Fields**: Encrypted in database

---

## 🔄 API Design Standards

### RESTful Conventions

#### HTTP Methods
- `GET` - Retrieve resources
- `POST` - Create new resource
- `PUT` - Update entire resource
- `PATCH` - Partial update
- `DELETE` - Remove resource

#### URL Structure
```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
```

#### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation successful"
}
```

**List Response (Paginated)**:
```json
{
  "success": true,
  "data": [ /* array of resources */ ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### HTTP Status Codes
- `200` OK - Successful GET, PUT, PATCH
- `201` Created - Successful POST
- `204` No Content - Successful DELETE
- `400` Bad Request - Validation error
- `401` Unauthorized - Authentication required
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `409` Conflict - Duplicate resource
- `422` Unprocessable Entity - Business logic error
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

### Pagination

**Query Parameters**:
```
?page=1&perPage=20
```

**Default Values**:
- page: 1
- perPage: 20
- maxPerPage: 100

### Filtering

**Query Parameters**:
```
?status=OPEN&severity=HIGH&departmentId=dept123
```

### Sorting

**Query Parameters**:
```
?sortBy=createdAt&order=desc
```

---

## 📊 Performance Requirements

### Response Time Targets
- **Authentication**: < 200ms
- **GET requests (single)**: < 150ms
- **GET requests (list)**: < 300ms
- **POST/PUT requests**: < 400ms
- **Complex queries (reports)**: < 1000ms
- **File uploads**: < 5s for 10MB file

### Throughput
- **Concurrent Users**: 500
- **Requests per Second**: 1000
- **Peak Load**: 2000 RPS

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling (max 20 connections)
- Query optimization (< 50ms)
- Caching for read-heavy operations (Redis)

### Caching Strategy
```typescript
// Cache TTL
{
  userProfile: 300,        // 5 minutes
  roles: 3600,             // 1 hour
  departments: 3600,       // 1 hour
  dashboardStats: 60,      // 1 minute
  reports: 300,            // 5 minutes
}
```

---

## 🧪 Testing Requirements

### Unit Tests
- **Coverage**: ≥ 80%
- **Framework**: Jest
- **Targets**:
  - All service methods
  - Utility functions
  - Validators
  - Middleware

### Integration Tests
- **Framework**: Supertest + Jest
- **Targets**:
  - All API endpoints
  - Authentication flow
  - Authorization checks
  - Database operations

### E2E Tests
- **Framework**: Playwright or Cypress
- **Scenarios**:
  - User registration and login
  - Incident reporting workflow
  - Investigation assignment
  - CAPA tracking
  - Training enrollment

### Load Tests
- **Tool**: k6 or Apache JMeter
- **Scenarios**:
  - 100 concurrent users
  - 500 concurrent users (stress test)
  - Gradual ramp-up over 10 minutes

### Security Tests
- **SQL Injection**: Automated testing with SQLMap
- **XSS**: Manual and automated testing
- **Authentication**: Bypass attempts
- **Authorization**: Permission escalation attempts
- **Rate Limiting**: Verification of limits

---

## 🚀 Deployment Specifications

### Environment Variables

#### Development
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/bfcl_dev
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
LOG_LEVEL=debug
```

#### Staging
```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://user:pass@db-staging:5432/bfcl_staging
JWT_SECRET=${VAULT_JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ALLOWED_ORIGINS=https://staging.bfcl.com
LOG_LEVEL=info
REDIS_URL=redis://redis-staging:6379
```

#### Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${VAULT_DATABASE_URL}
JWT_SECRET=${VAULT_JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ALLOWED_ORIGINS=https://app.bfcl.com
LOG_LEVEL=warn
REDIS_URL=${VAULT_REDIS_URL}
SENTRY_DSN=${VAULT_SENTRY_DSN}
```

### Docker Configuration

#### Development
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

#### Production
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

### Kubernetes Specifications

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bfcl-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bfcl-api
  template:
    metadata:
      labels:
        app: bfcl-api
    spec:
      containers:
      - name: api
        image: bfcl/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## 📈 Monitoring & Observability

### Metrics to Track

#### Application Metrics
- Request rate (RPS)
- Response time (p50, p95, p99)
- Error rate
- Active connections
- Memory usage
- CPU usage

#### Business Metrics
- Incidents reported per day
- Investigations completed per week
- CAPA completion rate
- Training attendance rate
- Audit compliance score

### Logging Standards

```typescript
// Log Levels
enum LogLevel {
  ERROR = 'error',    // System errors, exceptions
  WARN = 'warn',      // Warnings, potential issues
  INFO = 'info',      // General information
  DEBUG = 'debug'     // Debugging information
}

// Log Format (JSON)
{
  timestamp: "2025-10-27T10:30:00.000Z",
  level: "info",
  message: "User logged in",
  userId: "user123",
  email: "john@bfcl.com",
  ip: "192.168.1.10",
  userAgent: "Mozilla/5.0...",
  requestId: "req-abc123"
}
```

### Alerting Rules

```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "High error rate detected"

# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
  for: 5m
  annotations:
    summary: "95th percentile response time > 1s"

# Database connection issues
- alert: DatabaseConnectionFailed
  expr: up{job="postgres"} == 0
  for: 1m
  annotations:
    summary: "Database connection failed"
```

---

## 🔧 Development Tools

### Required Tools
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15
- VS Code (recommended)
- Postman or Insomnia (API testing)
- Git

### VS Code Extensions
- ESLint
- Prettier
- Prisma
- TypeScript and JavaScript Language Features
- Docker
- GitLens
- REST Client

### CLI Tools
```bash
# Prisma CLI
pnpm dlx prisma studio
pnpm dlx prisma migrate dev
pnpm dlx prisma generate

# Database management
psql -U postgres -d bfcl_safety

# Docker commands
docker-compose up -d
docker-compose logs -f api
docker-compose exec postgres psql -U postgres

# Kubernetes
kubectl get pods
kubectl logs pod-name
kubectl describe pod pod-name
```

---

## 📚 Additional Resources

### Documentation Links
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Standards & Compliance
- [OSHA 29 CFR 1904](https://www.osha.gov/laws-regs/regulations/standardnumber/1904)
- [ISO 45001:2018](https://www.iso.org/iso-45001-occupational-health-and-safety.html)

---

**Document Maintained By**: Technical Lead  
**Review Cycle**: Monthly  
**Last Review**: October 27, 2025  
**Next Review**: November 27, 2025
