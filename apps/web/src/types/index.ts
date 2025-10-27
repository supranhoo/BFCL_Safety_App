// User types
export interface User {
  id: string;
  email: string;
  name: string;
  employeeId: string;
  roleId: string;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  department?: Department;
}

export interface Role {
  id: string;
  name: string;
  level: number;
  permissions: string[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Incident types
export type IncidentType = 'INJURY' | 'ILLNESS' | 'NEAR_MISS' | 'PROPERTY_DAMAGE' | 'ENVIRONMENTAL';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CLOSED';

export interface Incident {
  id: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: string;
  incidentDate: string;
  reportedById: string;
  reportedBy?: User;
  departmentId: string | null;
  department?: Department;
  investigationRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

// Investigation types
export type InvestigationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'CLOSED';

export interface Investigation {
  id: string;
  investigationNumber: string;
  incidentId: string;
  incident?: Incident;
  status: InvestigationStatus;
  leadInvestigatorId: string;
  leadInvestigator?: User;
  rootCause: string | null;
  fiveWhys: string | null;
  recommendations: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// CAPA types
export type CAPAPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CAPAStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'OVERDUE' | 'CANCELLED';
export type CAPASourceType = 'INCIDENT' | 'INVESTIGATION' | 'AUDIT' | 'HAZARD' | 'MOCK_DRILL' | 'OTHER';

export interface CorrectiveAction {
  id: string;
  capaNumber: string;
  sourceType: CAPASourceType;
  sourceId: string | null;
  description: string;
  rootCause: string | null;
  correctiveAction: string;
  preventiveAction: string | null;
  priority: CAPAPriority;
  status: CAPAStatus;
  assignedToId: string;
  assignedTo?: User;
  dueDate: string;
  completedAt: string | null;
  verifiedAt: string | null;
  verifiedById: string | null;
  verifiedBy?: User;
  effectiveness: string | null;
  createdAt: string;
  updatedAt: string;
}

// Hazard types
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type HazardStatus = 'OPEN' | 'UNDER_REVIEW' | 'CONTROLS_IMPLEMENTED' | 'CLOSED';

export interface Hazard {
  id: string;
  hazardNumber: string;
  title: string;
  description: string;
  location: string;
  identifiedById: string;
  identifiedBy?: User;
  departmentId: string | null;
  department?: Department;
  likelihood: number;
  consequence: number;
  riskScore: number;
  riskLevel: RiskLevel;
  existingControls: string | null;
  suggestedControls: string | null;
  status: HazardStatus;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardStats {
  incidents: {
    total: number;
    open: number;
    closed: number;
    byType: Record<IncidentType, number>;
    bySeverity: Record<IncidentSeverity, number>;
  };
  capas: {
    total: number;
    open: number;
    inProgress: number;
    overdue: number;
    completed: number;
  };
  hazards: {
    total: number;
    open: number;
    byRiskLevel: Record<RiskLevel, number>;
  };
  investigations: {
    total: number;
    pending: number;
    approved: number;
  };
}

// Notification types
export type NotificationType =
  | 'INCIDENT_ASSIGNED'
  | 'INVESTIGATION_REQUIRED'
  | 'CAPA_ASSIGNED'
  | 'CAPA_OVERDUE'
  | 'TRAINING_SCHEDULED'
  | 'CERTIFICATION_EXPIRING'
  | 'AUDIT_SCHEDULED'
  | 'DRILL_SCHEDULED'
  | 'HAZARD_REPORTED'
  | 'APPROVAL_REQUIRED'
  | 'SYSTEM_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  statusCode: number;
  details?: unknown;
}
