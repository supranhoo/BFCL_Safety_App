# BFCL Safety Management System

A comprehensive, AI-ready digital platform for safety operations management, incident tracking, hazard identification, audits, training, and compliance monitoring.

## 🎯 Overview

The BFCL Safety Management System enables complete digital transformation of Safety Department activities with:

- **Incident & Near-Miss Reporting** - OSHA-compliant incident logging with automated investigation workflows
- **Investigation Management** - Root cause analysis, 5-Whys, severity-based routing
- **Hazard Identification (HIRA)** - Dynamic hazard register with risk assessment
- **Audit & Compliance** - Scheduled audits, checklists, NCR generation
- **Training & Certification** - LMS integration, attendance tracking, expiry alerts
- **PPE Management** - Inventory tracking, issuance, calibration records
- **Mock Drills** - Emergency preparedness with participation tracking
- **Analytics & KPI Tracking** - LTIFR, TRIR, compliance dashboards, OSHA logs

## 📋 Compliance Standards

- **OSHA 29 CFR 1904** - Injury and illness recordkeeping
- **ISO 45001** - Occupational health and safety management

## 🏗️ Architecture

### Monorepo Structure

```
bfcl-safety-management-system/
├── apps/
│   ├── web/              # React web application
│   └── mobile/           # React Native mobile app
├── services/
│   └── api/              # Express + TypeScript API
├── packages/
│   └── shared/           # Shared types, constants, utilities
├── infra/
│   ├── docker/           # Docker configurations
│   └── k8s/              # Kubernetes manifests
└── scripts/              # Setup and utility scripts
```

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- Zod Validation

**Frontend (Web):**
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query
- React Router

**Mobile:**
- React Native
- Expo
- Offline-first architecture

**Infrastructure:**
- Docker + Docker Compose
- Kubernetes
- PostgreSQL 15

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 15 (if running locally)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/supranhoo/BFCL_Safety_App.git
   cd BFCL_Safety_App
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp services/api/.env.example services/api/.env
   # Edit services/api/.env with your configuration
   ```

4. **Start with Docker Compose** (Recommended)
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL database (port 5432)
   - Backend API (port 3000)

5. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

6. **Seed demo data** (recommended for development)
   ```bash
   pnpm db:seed
   ```
   
   This seeds the database with comprehensive demo data including users, incidents, hazards, CAPAs, and more.
   See [Database Seeding Guide](services/api/SEEDING_GUIDE.md) for details.
   
   **Default Login Credentials:**
   - Email: `admin@bfcl.com`
   - Password: `Admin@123`

### Development

**Run all services in development mode:**
```bash
pnpm dev
```

**Run individual services:**
```bash
# API only
pnpm api:dev

# Web app only
pnpm web:dev

# Mobile app
pnpm mobile:dev
```

**Database management:**
```bash
# Open Prisma Studio
pnpm db:studio

# Create migration
pnpm db:migrate

# Generate Prisma Client
cd services/api && pnpm db:generate
```

## 📦 Modules

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- SSO integration (Azure AD/LDAP ready)
- MFA support

### 2. Incident Management
- One-tap incident reporting
- Auto-location and media capture
- OSHA-compliant fields
- Status workflow: Draft → Submitted → Under Review → Closed

**API Endpoints:**
```
POST   /api/v1/incidents
GET    /api/v1/incidents
GET    /api/v1/incidents/:id
PUT    /api/v1/incidents/:id
DELETE /api/v1/incidents/:id
POST   /api/v1/incidents/:id/submit
```

### 3. Investigation
- Automatic investigator assignment based on severity
- Root cause analysis (RCA)
- 5-Whys methodology
- CAPA generation and tracking

**API Endpoints:**
```
POST   /api/v1/investigations
GET    /api/v1/investigations
GET    /api/v1/investigations/:id
PUT    /api/v1/investigations/:id
POST   /api/v1/investigations/:id/submit
POST   /api/v1/investigations/:id/approve
```

### 4. Hazard Identification (HIRA)
- Hazard reporting
- Risk matrix (Likelihood x Consequence)
- Dynamic hazard register
- Control measure tracking

### 5. Audits & Inspections
- Scheduled audits (PPE, 5S, Fire Safety, etc.)
- Digital checklists
- NCR generation
- Compliance scoring

### 6. Training & Certification
- Training program management
- Session scheduling
- Attendance tracking
- Certification issuance
- Expiry alerts (30 days prior)

### 7. PPE Management
- Inventory tracking
- Issuance records
- Stock alerts
- Analyzer calibration tracking

### 8. Mock Drills
- Emergency drill scheduling
- Participation tracking
- Observation recording
- Gap analysis

### 9. Reports & Analytics
- Real-time dashboards
- KPI tracking (LTIFR, TRIR)
- OSHA 300/301 logs
- Compliance reports
- CAPA ageing reports

## 👥 User Roles & Permissions

| Role | Access Level | Key Responsibilities |
|------|-------------|---------------------|
| Safety Head | Full | Complete system access, final approvals |
| Assistant Safety Manager (ASM) | High | Team management, audits, training |
| Senior Safety Officer | Medium | Hazard tracking, audits, reports |
| Safety Officer | Operational | Incident logging, PPE, drills |
| Assistant Safety Officer | Field | Data entry, support tasks |
| Worker/Contractor | Limited | Report hazards, view training |

## 🔐 Security

- **Authentication:** JWT tokens with refresh mechanism
- **Authorization:** Role-based access control (RBAC)
- **Encryption:** TLS in transit, AES-256 at rest
- **Rate Limiting:** Protects against brute force
- **Audit Logging:** All actions logged with user, timestamp, IP
- **Input Validation:** Zod schemas for all inputs
- **SQL Injection Protection:** Prisma ORM parameterized queries

## 📊 Database Schema

Key entities:
- Users, Roles, Departments
- Incidents, Investigations
- Hazards, CorrectiveActions
- Audits, AuditItems
- TrainingPrograms, TrainingSessions, Certifications
- PPEItems, PPEIssuances
- MockDrills, MockDrillParticipants
- Notifications, AuditLogs

See full schema: `services/api/prisma/schema.prisma`

## 🔄 Workflows

### Incident → Investigation → CAPA → Closure
1. User submits incident
2. System routes to investigator (based on severity)
3. Investigation conducted with RCA
4. CAPA created and assigned
5. Department Head & Safety Head approve
6. KPIs updated upon closure

### Audit → NCR → CAPA
1. Audit conducted via checklist
2. Non-conformance generates CAPA
3. Assigned to individual
4. Tracked until verified

## 🌐 API Documentation

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:**
All protected endpoints require Bearer token:
```
Authorization: Bearer <access_token>
```

**Key Endpoints:**

```bash
# Authentication
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
GET    /auth/me

# Incidents
GET    /incidents?page=1&limit=10&status=OPEN
POST   /incidents
GET    /incidents/:id
PUT    /incidents/:id
POST   /incidents/:id/submit

# Reports
GET    /reports/dashboard
GET    /reports/incidents
GET    /reports/osha-log
GET    /reports/kpi
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run API tests
cd services/api && pnpm test

# Run with coverage
pnpm test:coverage
```

## 📱 Mobile App Features

- Offline-first architecture
- Auto-sync when back online
- Camera integration for incident photos
- GPS location capture
- Push notifications
- Biometric authentication

## 🤖 AI & Predictive Capabilities

- Risk trend analysis (machine-wise, shift-wise)
- NLP on incident narratives
- Predictive alerting based on environmental + human data
- Voice-based input for mobile reporting (planned)

## 🐳 Docker Deployment

**Development:**
```bash
docker-compose up -d
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f infra/k8s/config.yaml

# Deploy API
kubectl apply -f infra/k8s/api-deployment.yaml

# Check status
kubectl get pods
kubectl get services
```

## 📈 KPI Targets

- **LTIFR** (Lost Time Injury Frequency Rate): < 0.5
- **TRIR** (Total Recordable Incident Rate): < 2.0
- **Training Completion Rate**: 95%
- **CAPA Closure Rate**: 90% within due date
- **Audit Compliance Score**: 85%+

## 🛠️ Development Scripts

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Build all packages
pnpm build

# Lint code
pnpm lint

# Database operations
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open Prisma Studio
pnpm db:seed         # Seed database

# API-specific
pnpm api:dev         # Run API in dev mode
pnpm api:build       # Build API

# Web-specific
pnpm web:dev         # Run web app
pnpm web:build       # Build web app
```

## 📝 Environment Variables

### API (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bfcl_safety"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3001
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Copyright © 2025 BFCL. All rights reserved.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email: safety-support@bfcl.com

## 📚 Additional Resources

- [Database Seeding Guide](./services/api/SEEDING_GUIDE.md)
- [API Documentation](./docs/API.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Admin Guide](./docs/ADMIN_GUIDE.md)
- [Database Schema](./docs/DATABASE.md)

---

**Built with ❤️ for Safety Excellence** 
