// ==================== TYPE DEFINITIONS ====================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  employeeId?: string;
  roleId: string;
  role: Role;
  departmentId?: string;
  department?: Department;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  reportedById: string;
  reportedBy?: User;
  reportedAt: Date;
  incidentDate: Date;
  incidentTime: string;
  location: string;
  geoLocation?: string;
  departmentId?: string;
  department?: Department;
  incidentType: string;
  severity: string;
  injuryType?: string;
  bodyPartAffected?: string;
  witnessName?: string;
  witnessContact?: string;
  propertyDamage: boolean;
  damageDescription?: string;
  description: string;
  immediateAction?: string;
  status: string;
  investigationRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investigation {
  id: string;
  investigationNumber: string;
  incidentId: string;
  incident?: Incident;
  investigatorId: string;
  investigator?: User;
  investigationDate: Date;
  coInvestigators?: string[];
  findings: string;
  rootCause: string;
  fiveWhys?: FiveWhys;
  contributingFactors?: string;
  recommendations?: string;
  status: string;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiveWhys {
  problem: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
}

export interface CorrectiveAction {
  id: string;
  capaNumber: string;
  title: string;
  description: string;
  sourceType: string;
  sourceId: string;
  assignedToId: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
  dueDate: Date;
  status: string;
  priority: string;
  completionDate?: Date;
  completionRemarks?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  ageDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hazard {
  id: string;
  hazardNumber: string;
  reportedById: string;
  reportedBy?: User;
  reportedAt: Date;
  location: string;
  geoLocation?: string;
  departmentId?: string;
  department?: Department;
  category: string;
  description: string;
  potentialImpact: string;
  riskLevel: string;
  likelihood: number;
  consequence: number;
  riskScore: number;
  existingControls?: string;
  suggestedControls?: string;
  status: string;
  closedAt?: Date;
  closureRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  highSeverityIncidents: number;
  pendingInvestigations: number;
  openHazards: number;
  overdueCAPAs: number;
  upcomingTrainings: number;
  expiringCertifications: number;
  scheduledAudits: number;
  scheduledDrills: number;
}

export interface KPIData {
  ltifr: number; // Lost Time Injury Frequency Rate
  trir: number; // Total Recordable Incident Rate
  unsafeConditionsReported: number;
  trainingCompletionRate: number;
  capaClosureRate: number;
  averageCAPAAgeing: number;
  auditComplianceScore: number;
}
