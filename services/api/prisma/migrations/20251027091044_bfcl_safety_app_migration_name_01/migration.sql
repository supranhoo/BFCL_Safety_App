-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('INJURY', 'ILLNESS', 'NEAR_MISS', 'PROPERTY_DAMAGE', 'ENVIRONMENTAL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'UNDER_INVESTIGATION', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CAPASourceType" AS ENUM ('INVESTIGATION', 'AUDIT', 'HAZARD', 'MANUAL');

-- CreateEnum
CREATE TYPE "CAPAStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HazardCategory" AS ENUM ('MECHANICAL', 'ELECTRICAL', 'CHEMICAL', 'BIOLOGICAL', 'ERGONOMIC', 'PHYSICAL', 'ENVIRONMENTAL', 'BEHAVIORAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- CreateEnum
CREATE TYPE "HazardStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CONTROLS_IMPLEMENTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('PPE_INSPECTION', 'FIVE_S', 'FIRE_SAFETY', 'ELECTRICAL_SAFETY', 'MACHINE_SAFETY', 'HOUSEKEEPING', 'INTERNAL_AUDIT', 'EXTERNAL_AUDIT', 'COMPLIANCE_CHECK');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'UNDER_REVIEW', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'OBSERVATION', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('INDUCTION', 'REFRESHER', 'SKILL_BASED', 'COMPLIANCE', 'EMERGENCY_RESPONSE', 'EQUIPMENT_OPERATION');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PPECategory" AS ENUM ('HEAD_PROTECTION', 'EYE_PROTECTION', 'HEARING_PROTECTION', 'RESPIRATORY_PROTECTION', 'HAND_PROTECTION', 'FOOT_PROTECTION', 'BODY_PROTECTION', 'FALL_PROTECTION', 'SAFETY_EQUIPMENT');

-- CreateEnum
CREATE TYPE "PPEIssuanceStatus" AS ENUM ('ACTIVE', 'RETURNED', 'DAMAGED', 'LOST', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CalibrationStatus" AS ENUM ('VALID', 'DUE_SOON', 'OVERDUE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DrillType" AS ENUM ('FIRE_DRILL', 'EARTHQUAKE_DRILL', 'CHEMICAL_SPILL', 'MEDICAL_EMERGENCY', 'EVACUATION', 'LOCKDOWN');

-- CreateEnum
CREATE TYPE "DrillStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INCIDENT_ASSIGNED', 'INVESTIGATION_REQUIRED', 'CAPA_ASSIGNED', 'CAPA_OVERDUE', 'TRAINING_SCHEDULED', 'CERTIFICATION_EXPIRING', 'AUDIT_SCHEDULED', 'DRILL_SCHEDULED', 'HAZARD_REPORTED', 'APPROVAL_REQUIRED', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "employeeId" TEXT,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "headId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "geoLocation" TEXT,
    "departmentId" TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "injuryType" TEXT,
    "bodyPartAffected" TEXT,
    "witnessName" TEXT,
    "witnessContact" TEXT,
    "propertyDamage" BOOLEAN NOT NULL DEFAULT false,
    "damageDescription" TEXT,
    "description" TEXT NOT NULL,
    "immediateAction" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DRAFT',
    "investigationRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "investigationNumber" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "investigatorId" TEXT NOT NULL,
    "investigationDate" TIMESTAMP(3) NOT NULL,
    "coInvestigators" JSONB,
    "findings" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "fiveWhys" JSONB,
    "contributingFactors" TEXT,
    "recommendations" TEXT,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_actions" (
    "id" TEXT NOT NULL,
    "capaNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceType" "CAPASourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "investigationId" TEXT,
    "auditId" TEXT,
    "hazardId" TEXT,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "CAPAStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "completionDate" TIMESTAMP(3),
    "completionRemarks" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "ageDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corrective_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hazards" (
    "id" TEXT NOT NULL,
    "hazardNumber" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "geoLocation" TEXT,
    "departmentId" TEXT,
    "category" "HazardCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "potentialImpact" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "consequence" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "existingControls" TEXT,
    "suggestedControls" TEXT,
    "status" "HazardStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closureRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hazards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "auditNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "auditType" "AuditType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "auditorId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "departmentId" TEXT,
    "scope" TEXT NOT NULL,
    "checklistId" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'SCHEDULED',
    "overallScore" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "findings" TEXT,
    "nonConformances" INTEGER NOT NULL DEFAULT 0,
    "observations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "checkpointNumber" TEXT NOT NULL,
    "checkpoint" TEXT NOT NULL,
    "category" TEXT,
    "status" "AuditItemStatus" NOT NULL,
    "score" DOUBLE PRECISION,
    "remarks" TEXT,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trainingType" "TrainingType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "validityPeriod" INTEGER,
    "syllabus" TEXT,
    "videoUrl" TEXT,
    "documentUrl" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "targetRoles" JSONB,
    "hasQuiz" BOOLEAN NOT NULL DEFAULT false,
    "passingScore" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "sessionNumber" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "trainerId" TEXT,
    "trainerName" TEXT NOT NULL,
    "maxParticipants" INTEGER,
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_attendances" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "quizScore" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "certNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppe_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PPECategory" NOT NULL,
    "description" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "unitPrice" DOUBLE PRECISION,
    "size" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "hasExpiry" BOOLEAN NOT NULL DEFAULT false,
    "shelfLife" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppe_issuances" (
    "id" TEXT NOT NULL,
    "issuanceNumber" TEXT NOT NULL,
    "ppeItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "returnCondition" TEXT,
    "status" "PPEIssuanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppe_issuances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyzer_calibrations" (
    "id" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "lastCalibration" TIMESTAMP(3) NOT NULL,
    "nextCalibration" TIMESTAMP(3) NOT NULL,
    "calibratedBy" TEXT NOT NULL,
    "status" "CalibrationStatus" NOT NULL DEFAULT 'VALID',
    "certificateUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyzer_calibrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drills" (
    "id" TEXT NOT NULL,
    "drillNumber" TEXT NOT NULL,
    "drillType" "DrillType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "location" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "observers" JSONB NOT NULL,
    "status" "DrillStatus" NOT NULL DEFAULT 'SCHEDULED',
    "conductedDate" TIMESTAMP(3),
    "duration" INTEGER,
    "overallRating" DOUBLE PRECISION,
    "gaps" TEXT,
    "observations" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_drills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_drill_participants" (
    "id" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "performance" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mock_drill_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "incidentId" TEXT,
    "investigationId" TEXT,
    "hazardId" TEXT,
    "auditId" TEXT,
    "mockDrillId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_incidentNumber_key" ON "incidents"("incidentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_investigationNumber_key" ON "investigations"("investigationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_incidentId_key" ON "investigations"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "corrective_actions_capaNumber_key" ON "corrective_actions"("capaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hazards_hazardNumber_key" ON "hazards"("hazardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "audits_auditNumber_key" ON "audits"("auditNumber");

-- CreateIndex
CREATE UNIQUE INDEX "training_sessions_sessionNumber_key" ON "training_sessions"("sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "training_attendances_sessionId_userId_key" ON "training_attendances"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_certNumber_key" ON "certifications"("certNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ppe_issuances_issuanceNumber_key" ON "ppe_issuances"("issuanceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "analyzer_calibrations_equipmentId_key" ON "analyzer_calibrations"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drills_drillNumber_key" ON "mock_drills"("drillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "mock_drill_participants_drillId_userId_key" ON "mock_drill_participants"("drillId", "userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_investigatorId_fkey" FOREIGN KEY ("investigatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "hazards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hazards" ADD CONSTRAINT "hazards_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hazards" ADD CONSTRAINT "hazards_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendances" ADD CONSTRAINT "training_attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendances" ADD CONSTRAINT "training_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppe_issuances" ADD CONSTRAINT "ppe_issuances_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "ppe_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppe_issuances" ADD CONSTRAINT "ppe_issuances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drill_participants" ADD CONSTRAINT "mock_drill_participants_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "mock_drills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_drill_participants" ADD CONSTRAINT "mock_drill_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_hazardId_fkey" FOREIGN KEY ("hazardId") REFERENCES "hazards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_mockDrillId_fkey" FOREIGN KEY ("mockDrillId") REFERENCES "mock_drills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
