# BFCL Safety Management System - API Documentation

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- PostgreSQL 15

### Setup

1. **Install Dependencies**
```bash
pnpm install
```

2. **Start Database**
```bash
docker-compose up -d postgres
```

3. **Run Migrations & Seed**
```bash
pnpm db:migrate
pnpm db:seed
```

4. **Start API Server**
```bash
pnpm api:dev
```

The API will be available at `http://localhost:3000`

---

## 📋 Default Credentials

After seeding, you can login with:
- **Email**: `admin@bfcl.com`
- **Password**: `Admin@123`
- **Role**: Safety Head (Full Access)

---

## 🔐 Authentication

### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@bfcl.com",
  "username": "john.doe",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "employeeId": "EMP001",
  "roleId": "<role-uuid>",
  "departmentId": "<dept-uuid>"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@bfcl.com",
    "username": "john.doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": { "name": "Safety Officer", "level": 2 },
    "department": { "name": "Safety", "code": "SAF" }
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@bfcl.com",
  "password": "Admin@123"
}
```

### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access-token>
```

### Change Password
```http
PUT /api/v1/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

---

## 📝 Incident Management

### Create Incident
```http
POST /api/v1/incidents
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "incidentDate": "2025-10-27",
  "incidentTime": "14:30",
  "location": "Production Floor - Area B",
  "geoLocation": "12.9716,77.5946",
  "departmentId": "<dept-uuid>",
  "incidentType": "INJURY",
  "severity": "MEDIUM",
  "injuryType": "Cut",
  "bodyPartAffected": "Right Hand",
  "witnessName": "Jane Smith",
  "witnessContact": "+1234567890",
  "propertyDamage": false,
  "description": "Worker sustained a minor cut while operating machinery",
  "immediateAction": "First aid provided, area cordoned off"
}
```

**Incident Types**: `INJURY`, `ILLNESS`, `NEAR_MISS`, `PROPERTY_DAMAGE`, `ENVIRONMENTAL`

**Severity Levels**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

### Get All Incidents
```http
GET /api/v1/incidents?page=1&limit=20&status=SUBMITTED&severity=HIGH
Authorization: Bearer <access-token>
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)
- `status`: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `UNDER_INVESTIGATION`, `CLOSED`
- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `departmentId`: Filter by department
- `incidentType`: Filter by type

### Get Incident by ID
```http
GET /api/v1/incidents/:id
Authorization: Bearer <access-token>
```

### Update Incident
```http
PUT /api/v1/incidents/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "description": "Updated description",
  "immediateAction": "Additional actions taken"
}
```

### Submit Incident
```http
POST /api/v1/incidents/:id/submit
Authorization: Bearer <access-token>
```

### Delete Incident
```http
DELETE /api/v1/incidents/:id
Authorization: Bearer <access-token>
```

---

## 🔍 Investigation Management

### Create Investigation
```http
POST /api/v1/investigations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "incidentId": "<incident-uuid>",
  "investigationDate": "2025-10-28",
  "findings": "Detailed findings from investigation",
  "rootCause": "Root cause analysis",
  "fiveWhys": {
    "why1": "Machine guard was not in place",
    "why2": "Maintenance was overdue",
    "why3": "Maintenance schedule not followed",
    "why4": "Insufficient monitoring",
    "why5": "Lack of accountability"
  },
  "contributingFactors": "Lack of training, time pressure",
  "recommendations": "Implement regular audits, provide training"
}
```

### Get All Investigations
```http
GET /api/v1/investigations?page=1&limit=20&status=APPROVED
Authorization: Bearer <access-token>
```

### Update Investigation
```http
PUT /api/v1/investigations/:id
Authorization: Bearer <access-token>
```

### Submit for Approval
```http
POST /api/v1/investigations/:id/submit
Authorization: Bearer <access-token>
```

---

## ⚠️ Hazard Management

### Report Hazard
```http
POST /api/v1/hazards
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "location": "Warehouse - Section C",
  "geoLocation": "12.9716,77.5946",
  "departmentId": "<dept-uuid>",
  "category": "MECHANICAL",
  "description": "Exposed rotating parts on conveyor belt",
  "potentialImpact": "Risk of entanglement and serious injury",
  "riskLevel": "HIGH",
  "likelihood": 4,
  "consequence": 5,
  "existingControls": "Warning signs posted",
  "suggestedControls": "Install machine guard, provide training"
}
```

**Hazard Categories**: `MECHANICAL`, `ELECTRICAL`, `CHEMICAL`, `BIOLOGICAL`, `ERGONOMIC`, `PHYSICAL`, `ENVIRONMENTAL`, `BEHAVIORAL`

**Risk Levels**: `LOW`, `MEDIUM`, `HIGH`, `EXTREME`

### Get All Hazards
```http
GET /api/v1/hazards?status=OPEN&riskLevel=HIGH
Authorization: Bearer <access-token>
```

### Update Hazard
```http
PUT /api/v1/hazards/:id
Authorization: Bearer <access-token>
```

### Close Hazard
```http
POST /api/v1/hazards/:id/close
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "closureRemarks": "Machine guard installed and verified"
}
```

---

## ✅ Audit & Inspection

### Create Audit
```http
POST /api/v1/audits
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Monthly PPE Inspection",
  "auditType": "PPE_INSPECTION",
  "scheduledDate": "2025-11-01",
  "location": "All Production Areas",
  "departmentId": "<dept-uuid>",
  "scope": "Check PPE usage compliance across all shifts",
  "auditItems": [
    {
      "checkpointNumber": "1",
      "checkpoint": "Workers wearing hard hats",
      "category": "Head Protection",
      "status": "COMPLIANT"
    },
    {
      "checkpointNumber": "2",
      "checkpoint": "Safety shoes in good condition",
      "category": "Foot Protection",
      "status": "NON_COMPLIANT",
      "remarks": "3 workers with worn-out shoes"
    }
  ]
}
```

**Audit Types**: `PPE_INSPECTION`, `FIVE_S`, `FIRE_SAFETY`, `ELECTRICAL_SAFETY`, `MACHINE_SAFETY`, `HOUSEKEEPING`, `INTERNAL_AUDIT`, `EXTERNAL_AUDIT`, `COMPLIANCE_CHECK`

### Get All Audits
```http
GET /api/v1/audits?status=COMPLETED
Authorization: Bearer <access-token>
```

### Complete Audit
```http
POST /api/v1/audits/:id/complete
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "overallScore": 85.5,
  "passed": true,
  "findings": "Overall compliance is good, minor issues identified"
}
```

---

## 🎓 Training Management

### Create Training Program
```http
POST /api/v1/training/programs
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Fire Safety Training",
  "description": "Comprehensive fire safety and emergency response training",
  "trainingType": "COMPLIANCE",
  "duration": 120,
  "validityPeriod": 365,
  "isMandatory": true,
  "hasQuiz": true,
  "passingScore": 80
}
```

### Schedule Training Session
```http
POST /api/v1/training/sessions
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "programId": "<program-uuid>",
  "scheduledDate": "2025-11-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "location": "Training Room A",
  "trainerName": "John Safety Expert",
  "maxParticipants": 30
}
```

### Record Attendance
```http
POST /api/v1/training/sessions/:id/attendance
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "attendances": [
    {
      "userId": "<user-uuid>",
      "attended": true,
      "quizScore": 92,
      "passed": true
    }
  ]
}
```

---

## 🦺 PPE Management

### Create PPE Item
```http
POST /api/v1/ppe/items
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Safety Helmet - Type A",
  "category": "HEAD_PROTECTION",
  "description": "Industrial safety helmet with chin strap",
  "stockQuantity": 150,
  "reorderLevel": 20,
  "unitPrice": 25.50,
  "manufacturer": "SafetyPro Inc.",
  "hasExpiry": true,
  "shelfLife": 1825
}
```

### Issue PPE
```http
POST /api/v1/ppe/issuances
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "ppeItemId": "<item-uuid>",
  "userId": "<user-uuid>",
  "quantity": 1,
  "expiryDate": "2028-10-27"
}
```

### Return PPE
```http
POST /api/v1/ppe/issuances/:id/return
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "returnCondition": "Good",
  "remarks": "Returned in acceptable condition"
}
```

---

## 🚨 Mock Drills

### Schedule Drill
```http
POST /api/v1/mock-drills
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "drillType": "FIRE_DRILL",
  "scheduledDate": "2025-11-20",
  "startTime": "10:00",
  "location": "Building A",
  "scenario": "Simulated fire in electrical room",
  "observers": ["<user-uuid-1>", "<user-uuid-2>"]
}
```

**Drill Types**: `FIRE_DRILL`, `EARTHQUAKE_DRILL`, `CHEMICAL_SPILL`, `MEDICAL_EMERGENCY`, `EVACUATION`, `LOCKDOWN`

### Record Drill Results
```http
POST /api/v1/mock-drills/:id/complete
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "duration": 8,
  "overallRating": 8.5,
  "gaps": "Some delays in assembly point gathering",
  "observations": "Overall good response, coordination needs improvement",
  "recommendations": "Conduct more frequent drills, improve signage"
}
```

---

## 📊 Reports & Analytics

### Get Dashboard Statistics
```http
GET /api/v1/reports/dashboard
Authorization: Bearer <access-token>
```

### Get Incident Statistics
```http
GET /api/v1/reports/incidents/stats?dateFrom=2025-01-01&dateTo=2025-10-27
Authorization: Bearer <access-token>
```

### Get LTIFR (Lost Time Injury Frequency Rate)
```http
GET /api/v1/reports/kpi/ltifr?year=2025
Authorization: Bearer <access-token>
```

### Export OSHA Logs
```http
GET /api/v1/reports/osha/300?year=2025&format=xlsx
Authorization: Bearer <access-token>
```

---

## 🔔 Notifications

### Get User Notifications
```http
GET /api/v1/notifications?isRead=false
Authorization: Bearer <access-token>
```

### Mark as Read
```http
PUT /api/v1/notifications/:id/read
Authorization: Bearer <access-token>
```

### Mark All as Read
```http
PUT /api/v1/notifications/read-all
Authorization: Bearer <access-token>
```

---

## 👥 User Management

### Get All Users
```http
GET /api/v1/users?roleId=<role-uuid>&departmentId=<dept-uuid>
Authorization: Bearer <access-token>
```

### Get User by ID
```http
GET /api/v1/users/:id
Authorization: Bearer <access-token>
```

### Update User
```http
PUT /api/v1/users/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Updated",
  "phoneNumber": "+9876543210",
  "departmentId": "<new-dept-uuid>"
}
```

### Deactivate User
```http
PUT /api/v1/users/:id/deactivate
Authorization: Bearer <access-token>
```

---

## 🔍 Audit Logs

### Get Audit Trail
```http
GET /api/v1/audit/logs?resource=incidents&resourceId=<incident-uuid>
Authorization: Bearer <access-token>
```

---

## 🚦 Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **Auth endpoints** (login, register): 5 requests per 15 minutes

---

## 📮 Postman Collection

Import the Postman collection for easy API testing:

```bash
# Collection available at: ./postman/BFCL_Safety_API.postman_collection.json
```

---

## 🐛 Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2025-10-27T10:00:00.000Z"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bfcl_safety?schema=public"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
```

---

## 📚 Database Schema

The database includes the following main entities:

- **Users** - User accounts with role-based access
- **Roles** - Role definitions with permission levels
- **Departments** - Organizational departments
- **Incidents** - Incident reports with OSHA compliance
- **Investigations** - Investigation records with RCA
- **Hazards** - HIRA (Hazard Identification & Risk Assessment)
- **Audits** - Safety audits and inspections
- **Training** - Training programs, sessions, certifications
- **PPE** - PPE inventory and issuance tracking
- **Mock Drills** - Emergency drill records
- **Corrective Actions** - CAPA tracking
- **Notifications** - User notifications
- **Audit Logs** - Complete audit trail

---

## 🧪 Testing

### Run Tests
```bash
pnpm test
```

### Manual Testing with curl

**Health Check**:
```bash
curl http://localhost:3000/health
```

**Login**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bfcl.com","password":"Admin@123"}'
```

**Create Incident**:
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incidentDate": "2025-10-27",
    "incidentTime": "14:30",
    "location": "Production Floor",
    "incidentType": "NEAR_MISS",
    "severity": "LOW",
    "description": "Near miss incident test",
    "propertyDamage": false
  }'
```

---

## 🔄 Database Management

### View Database in Prisma Studio
```bash
pnpm db:studio
```

### Create New Migration
```bash
pnpm db:migrate
```

### Reset Database
```bash
cd services/api
pnpm prisma migrate reset
```

---

## 📈 Next Steps

1. **Frontend Development**: Create React web application
2. **Mobile App**: Develop Android-first mobile app
3. **File Uploads**: Implement file attachment handling
4. **Email Notifications**: Set up SMTP for email alerts
5. **SSO Integration**: Integrate Azure AD authentication
6. **Advanced Analytics**: Build predictive analytics dashboard
7. **Offline Mode**: Implement progressive web app features
8. **API Testing**: Complete unit and integration tests

---

## 🤝 Contributing

Please refer to `CONTRIBUTING.md` for development guidelines.

---

## 📄 License

Proprietary - BFCL Safety Management System

---

## 💬 Support

For support and questions:
- Email: support@bfcl.com
- Internal Wiki: https://wiki.bfcl.com/safety-app
